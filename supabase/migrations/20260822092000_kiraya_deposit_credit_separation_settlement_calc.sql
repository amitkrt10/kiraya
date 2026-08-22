-- P5.7F Migration C — settlement calculation/posting for the locked Model C2.
--
-- 1. Extends the tenant-balance primitives so the two new ledger entry types actually
--    move get_tenant_balance() (otherwise posting them would be inert — P5.7E-LOCK §5).
-- 2. Extends v_tenant_ledger's running balance identically, so the Ledger tab/tenant
--    statement stay consistent with get_tenant_balance().
-- 3. Rewrites kiraya.calculate_exit_settlement() to the locked C2 formula (P5.7E-LOCK §2):
--       previous_dues = greatest(0, get_tenant_balance())
--       available_credit = greatest(0, -get_tenant_balance())
--       credit_applied = least(available_credit, final_charges)
--       remaining_charges = final_charges - credit_applied
--       deposit_consumed = least(remaining_charges, get_security_deposit_held())
--       final_amount_due = previous_dues + (remaining_charges - deposit_consumed)
--       deposit_origin_refundable = held - deposit_consumed
--       credit_origin_refundable = available_credit - credit_applied
--    This never lets deposit or credit reduce previous_dues (Model C2), and never
--    double-subtracts credit (P5.7C).
-- 4. Rewrites kiraya.post_exit_settlement_to_ledger(): SECURITY DEFINER (P5.7E-LOCK §11 —
--    required, confirmed the insert would otherwise fail RLS), posts the FULL
--    final_charges (never a pre-netted figure — P5.7E-LOCK §5's proven correction),
--    guarded on final_charges > 0 instead of final_amount_due.
-- 5. Adds kiraya.post_deposit_application_to_ledger(): SECURITY DEFINER, credit-only,
--    posts exactly deposit_consumed, linked to both the exit settlement and the real
--    security_deposit_transactions.DEDUCTION row it mirrors.
-- 6. Rewrites kiraya.finalize_exit_settlement() to atomically: recalculate, flip status,
--    create the settlement-linked DEDUCTION (idempotent) when deposit_consumed > 0,
--    post DEPOSIT_APPLICATION, and post EXIT_SETTLEMENT — all in one transaction, so a
--    failure anywhere leaves the settlement DRAFT with no partial writes (P5.7E-LOCK §6).

-- Step 1: tenant-balance primitives.
create or replace function kiraya.get_tenant_debit_total(p_tenant_id uuid)
returns numeric
language sql
stable
set search_path to 'kiraya', 'public'
as $function$
    select coalesce(sum(le.debit_amount), 0)
    from kiraya.ledger_entries le
    where le.tenant_id = p_tenant_id
      and le.entry_type in ('BILL', 'EXIT_SETTLEMENT', 'CREDIT_REFUND')
      and le.is_reversal = false
      and not exists (
          select 1
          from kiraya.ledger_entries r
          where r.reverses_entry_id = le.id
            and r.is_reversal = true
      );
$function$;

comment on function kiraya.get_tenant_debit_total(uuid) is
  'P5.7F: added CREDIT_REFUND — paying out a credit-origin refund must bring the tenant''s '
  'balance back up by that amount (it is the mirror image of the surplus being paid out), '
  'exactly as BILL/EXIT_SETTLEMENT already increase debt.';

create or replace function kiraya.get_tenant_credit_total(p_tenant_id uuid)
returns numeric
language sql
stable
set search_path to 'kiraya', 'public'
as $function$
    select coalesce(sum(le.credit_amount), 0)
    from kiraya.ledger_entries le
    where le.tenant_id = p_tenant_id
      and le.entry_type in ('PAYMENT', 'DEPOSIT_APPLICATION')
      and le.is_reversal = false
      and not exists (
          select 1
          from kiraya.ledger_entries r
          where r.reverses_entry_id = le.id
            and r.is_reversal = true
      );
$function$;

comment on function kiraya.get_tenant_credit_total(uuid) is
  'P5.7F: added DEPOSIT_APPLICATION — this is the sole mechanism by which a security deposit''s '
  'contribution to an exit settlement actually reduces get_tenant_balance(); without this, '
  'posting the entry would be inert (P5.7E-LOCK §5).';

-- Step 2: v_tenant_ledger's running balance must recognize the same two entry types,
-- or the Ledger tab/tenant statement would silently disagree with get_tenant_balance().
create or replace view kiraya.v_tenant_ledger as
select
    le.organization_id,
    le.id as ledger_entry_id,
    le.tenant_id,
    t.tenant_code,
    t.display_name as tenant_name,
    le.lease_id,
    l.lease_code,
    le.bill_id,
    b.bill_number,
    le.payment_id,
    pay.payment_number,
    le.entry_type,
    le.entry_date,
    le.description,
    coalesce(le.debit_amount, 0::numeric) as debit_amount,
    coalesce(le.credit_amount, 0::numeric) as credit_amount,
    le.currency_code,
    le.reference_code,
    le.is_reversal,
    le.reverses_entry_id,
    le.created_at,
    sum(
        case
            when le.entry_type = any (array[
                'BILL'::kiraya.ledger_entry_type,
                'PAYMENT'::kiraya.ledger_entry_type,
                'REVERSAL'::kiraya.ledger_entry_type,
                'EXIT_SETTLEMENT'::kiraya.ledger_entry_type,
                'DEPOSIT_APPLICATION'::kiraya.ledger_entry_type,
                'CREDIT_REFUND'::kiraya.ledger_entry_type
            ]) then coalesce(le.debit_amount, 0::numeric) - coalesce(le.credit_amount, 0::numeric)
            else 0::numeric
        end
    ) over (
        partition by le.tenant_id
        order by le.entry_date, le.created_at, le.id
        rows between unbounded preceding and current row
    ) as running_balance
from kiraya.ledger_entries le
join kiraya.tenants t on t.id = le.tenant_id
left join kiraya.leases l on l.id = le.lease_id
left join kiraya.bills b on b.id = le.bill_id
left join kiraya.payments pay on pay.id = le.payment_id;

comment on view kiraya.v_tenant_ledger is
  'P5.7F: running_balance now also includes DEPOSIT_APPLICATION/CREDIT_REFUND, matching '
  'kiraya.get_tenant_balance() exactly (ADJUSTMENT and the DEPOSIT_RECEIPT/DEDUCTION/REFUND '
  'entry types remain excluded — still dead, per the pre-existing P5.7 finding).';

-- Step 3: the locked C2 calculation.
create or replace function kiraya.calculate_exit_settlement(p_exit_settlement_id uuid)
returns kiraya.exit_settlements
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
declare
    v_settlement kiraya.exit_settlements%rowtype;

    v_balance numeric(18,2);
    v_previous_dues numeric(18,2);
    v_available_credit numeric(18,2);

    v_final_charges numeric(18,2);
    v_credit_applied numeric(18,2);
    v_remaining_charges numeric(18,2);

    v_security_deposit_id uuid;
    v_held numeric(18,2);
    v_deposit_consumed numeric(18,2);

    v_payable numeric(18,2);
    v_deposit_origin_refundable numeric(18,2);
    v_credit_origin_refundable numeric(18,2);
begin

    select *
    into v_settlement
    from kiraya.exit_settlements
    where id = p_exit_settlement_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Exit settlement does not exist.';
    end if;


    /*
     * Ledger side (P5.7C): one signed balance, split into its two
     * complementary, mutually-exclusive halves. Never combined with a
     * separately-derived "available credit" figure (that was the P5.7B/C
     * double-counting defect) — both halves come from the same read.
     */
    v_balance := kiraya.get_tenant_balance(v_settlement.tenant_id);
    v_previous_dues := greatest(0, v_balance);
    v_available_credit := greatest(0, -v_balance);


    /*
     * New exit charges only — PREVIOUS_DUE and the now-blocked
     * DEPOSIT_DEDUCTION item types are still excluded (the former was
     * always excluded; the latter can no longer be inserted at all,
     * migration B).
     */
    select coalesce(
        sum(
            case
                when is_credit = false
                    then amount
                else 0
            end
        ),
        0
    )
    into v_final_charges
    from kiraya.exit_settlement_items
    where exit_settlement_id = p_exit_settlement_id
      and item_type <> 'PREVIOUS_DUE'
      and item_type <> 'DEPOSIT_DEDUCTION';


    /*
     * Model C2: credit offsets new charges ONLY, never previous_dues.
     */
    v_credit_applied := least(v_available_credit, v_final_charges);
    v_remaining_charges := v_final_charges - v_credit_applied;


    /*
     * Model C2: deposit offsets whatever of the new charges credit didn't
     * already cover — again, never previous_dues, and never more than is
     * actually held.
     */
    select sd.id
    into v_security_deposit_id
    from kiraya.security_deposits sd
    where sd.lease_id = v_settlement.lease_id
    limit 1;

    v_held := coalesce(kiraya.get_security_deposit_held(v_security_deposit_id), 0);
    v_deposit_consumed := least(v_remaining_charges, v_held);


    v_payable := v_previous_dues + (v_remaining_charges - v_deposit_consumed);
    v_deposit_origin_refundable := v_held - v_deposit_consumed;
    v_credit_origin_refundable := v_available_credit - v_credit_applied;


    update kiraya.exit_settlements
    set
        previous_dues = v_previous_dues,
        final_charges = v_final_charges,
        deposit_deduction = 0,
        tenant_credit = v_available_credit,
        credit_applied = v_credit_applied,
        deposit_consumed = v_deposit_consumed,
        final_amount_due = round(v_payable, 2),
        deposit_origin_refundable = round(v_deposit_origin_refundable, 2),
        credit_origin_refundable = round(v_credit_origin_refundable, 2),
        final_amount_refundable = round(v_deposit_origin_refundable + v_credit_origin_refundable, 2),
        updated_at = now()
    where id = p_exit_settlement_id
    returning * into v_settlement;


    return v_settlement;
end;
$function$;

comment on function kiraya.calculate_exit_settlement(uuid) is
  'P5.7F: Model C2 (locked P5.7E) — deposit and credit offset final_charges only, never '
  'previous_dues. payable/deposit_origin_refundable/credit_origin_refundable are all '
  'independently >= 0 by construction (no if/else branch needed, unlike the pre-P5.7F formula).';

-- Step 4: post the full new charge — never a pre-netted amount (P5.7E-LOCK §5).
create or replace function kiraya.post_exit_settlement_to_ledger(p_exit_settlement_id uuid, p_created_by uuid default null::uuid)
returns uuid
language plpgsql
security definer
set search_path to 'kiraya', 'public'
as $function$
declare
    v_settlement kiraya.exit_settlements%rowtype;
    v_entry_id uuid;
begin

    select *
    into v_settlement
    from kiraya.exit_settlements
    where id = p_exit_settlement_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Exit settlement does not exist.';
    end if;

    -- SECURITY DEFINER bypasses RLS entirely, so the explicit authorization
    -- check below is the real boundary, matching kiraya.post_credit_application_to_ledger()'s
    -- established pattern.
    if not kiraya.can_write_organization(v_settlement.organization_id) then
        raise exception
            using
                errcode = '42501',
                message = 'Not authorized to post this exit settlement.';
    end if;


    if v_settlement.status <> 'FINALIZED' then
        raise exception
            using
                errcode = '23514',
                message = 'Only finalized exit settlements can be posted.';
    end if;


    /*
     * Post the FULL final_charges, never final_amount_due/a pre-netted
     * figure. The tenant's existing ledger balance (which may already be
     * negative/in credit) absorbs this debit through ordinary balance
     * arithmetic — no separate "credit consumption" entry is needed
     * (P5.7C). Any deposit contribution is captured separately, by
     * post_deposit_application_to_ledger(), never by shrinking this amount.
     */
    if v_settlement.final_charges <= 0 then
        return null;
    end if;


    if exists (
        select 1
        from kiraya.ledger_entries
        where exit_settlement_id = p_exit_settlement_id
          and entry_type = 'EXIT_SETTLEMENT'
          and is_reversal = false
    ) then

        select id
        into v_entry_id
        from kiraya.ledger_entries
        where exit_settlement_id = p_exit_settlement_id
          and entry_type = 'EXIT_SETTLEMENT'
          and is_reversal = false
        order by created_at
        limit 1;

        return v_entry_id;

    end if;


    insert into kiraya.ledger_entries (
        organization_id,
        tenant_id,
        lease_id,
        exit_settlement_id,
        entry_type,
        entry_date,
        description,
        debit_amount,
        credit_amount,
        currency_code,
        reference_code,
        created_by,
        metadata
    )
    values (
        v_settlement.organization_id,
        v_settlement.tenant_id,
        v_settlement.lease_id,
        v_settlement.id,
        'EXIT_SETTLEMENT',
        v_settlement.settlement_date,
        'Final tenant exit charges',
        v_settlement.final_charges,
        0,
        v_settlement.currency_code,
        v_settlement.settlement_reference,
        p_created_by,
        jsonb_build_object(
            'final_charges', v_settlement.final_charges,
            'credit_applied', v_settlement.credit_applied,
            'deposit_consumed', v_settlement.deposit_consumed
        )
    )
    returning id into v_entry_id;


    return v_entry_id;
end;
$function$;

comment on function kiraya.post_exit_settlement_to_ledger(uuid, uuid) is
  'P5.7F: now SECURITY DEFINER (required — ledger_entries has zero client INSERT policy, '
  'confirmed P5.7A/C). Posts the FULL final_charges, never final_amount_due — see '
  'post_deposit_application_to_ledger() for the deposit-side offset.';

-- Step 5: the new deposit-application ledger posting.
create or replace function kiraya.post_deposit_application_to_ledger(
    p_exit_settlement_id uuid,
    p_security_deposit_transaction_id uuid,
    p_created_by uuid default null::uuid
)
returns uuid
language plpgsql
security definer
set search_path to 'kiraya', 'public'
as $function$
declare
    v_settlement kiraya.exit_settlements%rowtype;
    v_entry_id uuid;
begin

    select *
    into v_settlement
    from kiraya.exit_settlements
    where id = p_exit_settlement_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Exit settlement does not exist.';
    end if;

    if not kiraya.can_write_organization(v_settlement.organization_id) then
        raise exception
            using
                errcode = '42501',
                message = 'Not authorized to post this deposit application.';
    end if;

    if v_settlement.status <> 'FINALIZED' then
        raise exception
            using
                errcode = '23514',
                message = 'Only finalized exit settlements can post a deposit application.';
    end if;

    if v_settlement.deposit_consumed <= 0 then
        return null;
    end if;


    if exists (
        select 1
        from kiraya.ledger_entries
        where exit_settlement_id = p_exit_settlement_id
          and entry_type = 'DEPOSIT_APPLICATION'
          and is_reversal = false
    ) then

        select id
        into v_entry_id
        from kiraya.ledger_entries
        where exit_settlement_id = p_exit_settlement_id
          and entry_type = 'DEPOSIT_APPLICATION'
          and is_reversal = false
        order by created_at
        limit 1;

        return v_entry_id;

    end if;


    -- Credit-only: this is the entry that actually moves get_tenant_balance()
    -- to reflect the deposit's contribution (deposit money has never touched
    -- the ledger before this point — unlike tenant credit, which was already
    -- counted via its originating PAYMENT).
    insert into kiraya.ledger_entries (
        organization_id,
        tenant_id,
        lease_id,
        exit_settlement_id,
        security_deposit_transaction_id,
        entry_type,
        entry_date,
        description,
        debit_amount,
        credit_amount,
        currency_code,
        reference_code,
        created_by,
        metadata
    )
    values (
        v_settlement.organization_id,
        v_settlement.tenant_id,
        v_settlement.lease_id,
        v_settlement.id,
        p_security_deposit_transaction_id,
        'DEPOSIT_APPLICATION',
        v_settlement.settlement_date,
        'Security deposit applied to exit settlement charges',
        0,
        v_settlement.deposit_consumed,
        v_settlement.currency_code,
        v_settlement.settlement_reference,
        p_created_by,
        jsonb_build_object('deposit_consumed', v_settlement.deposit_consumed)
    )
    returning id into v_entry_id;


    return v_entry_id;
end;
$function$;

comment on function kiraya.post_deposit_application_to_ledger(uuid, uuid, uuid) is
  'P5.7F: credit-only ledger mirror of a settlement-linked security_deposit_transactions.'
  'DEDUCTION row. Excluded from the deposit subledger itself (that is the DEDUCTION row''s '
  'job) — this function only ever touches ledger_entries.';

-- Step 6: atomic finalization — recalculate, flip status, and post every
-- accounting side-effect (deposit deduction, deposit application, exit charge)
-- in one transaction. Any failure rolls back everything; no partial state.
create or replace function kiraya.finalize_exit_settlement(p_exit_settlement_id uuid, p_finalized_by uuid)
returns kiraya.exit_settlements
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
declare
    v_settlement kiraya.exit_settlements%rowtype;
    v_security_deposit_id uuid;
    v_deduction_id uuid;
begin

    select *
    into v_settlement
    from kiraya.exit_settlements
    where id = p_exit_settlement_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Exit settlement does not exist.';
    end if;

    if v_settlement.status <> 'DRAFT' then
        raise exception
            using
                errcode = '23514',
                message = 'Only draft exit settlements can be finalized.';
    end if;


    /*
     * Always recalculate immediately before finalization.
     */
    v_settlement :=
        kiraya.calculate_exit_settlement(
            p_exit_settlement_id
        );


    perform set_config('kiraya.financial_context', '1', true);

    update kiraya.exit_settlements
    set
        status = 'FINALIZED',
        finalized_at = now(),
        finalized_by = p_finalized_by,
        updated_at = now()
    where id = p_exit_settlement_id
    returning * into v_settlement;


    /*
     * Mark the exit process as awaiting final payment/refund.
     */
    update kiraya.tenant_exits
    set
        status = 'PENDING_SETTLEMENT',
        updated_at = now()
    where id = v_settlement.tenant_exit_id
      and status in (
          'INITIATED',
          'PENDING_SETTLEMENT'
      );


    /*
     * Deposit consumption (Model C2): create the real, settlement-linked
     * DEDUCTION and its ledger mirror together, atomically with everything
     * else here. A settlement can never claim a deposit deduction without
     * this real deposit-side event existing (P5.7D/E's core guarantee).
     */
    if v_settlement.deposit_consumed > 0 then

        select sd.id
        into v_security_deposit_id
        from kiraya.security_deposits sd
        where sd.lease_id = v_settlement.lease_id
        limit 1;

        if v_security_deposit_id is null then
            raise exception
                using
                    errcode = '23514',
                    message = 'Deposit consumption was computed but no security deposit exists for this lease.';
        end if;

        -- Idempotency: a settlement-linked deduction for this settlement may
        -- already exist (e.g. a retried call after a prior partial failure
        -- was rolled back — this guards a second, successful attempt).
        select id
        into v_deduction_id
        from kiraya.security_deposit_transactions
        where exit_settlement_id = p_exit_settlement_id
          and transaction_type = 'DEDUCTION'
        limit 1;

        if v_deduction_id is null then

            insert into kiraya.security_deposit_transactions (
                organization_id,
                security_deposit_id,
                tenant_id,
                lease_id,
                transaction_type,
                transaction_date,
                amount,
                currency_code,
                exit_settlement_id,
                created_by,
                description,
                reference_code
            )
            values (
                v_settlement.organization_id,
                v_security_deposit_id,
                v_settlement.tenant_id,
                v_settlement.lease_id,
                'DEDUCTION',
                v_settlement.settlement_date,
                v_settlement.deposit_consumed,
                v_settlement.currency_code,
                p_exit_settlement_id,
                p_finalized_by,
                'Deposit applied to exit settlement ' || v_settlement.settlement_reference,
                v_settlement.settlement_reference
            )
            returning id into v_deduction_id;

        end if;

        perform kiraya.post_deposit_application_to_ledger(
            p_exit_settlement_id,
            v_deduction_id,
            p_finalized_by
        );

    end if;


    /*
     * New exit charges, net of whatever credit already absorbed (P5.7C) —
     * post the full final_charges; the deposit's contribution above is a
     * separate, already-posted credit.
     */
    if v_settlement.final_charges > 0 then
        perform kiraya.post_exit_settlement_to_ledger(
            p_exit_settlement_id,
            p_finalized_by
        );
    end if;


    return v_settlement;
end;
$function$;

comment on function kiraya.finalize_exit_settlement(uuid, uuid) is
  'P5.7F: fully atomic — recalculation, status flip, settlement-linked DEDUCTION, '
  'DEPOSIT_APPLICATION, and EXIT_SETTLEMENT all happen in this one function/transaction. '
  'Any exception rolls back everything (no partial deduction, no partial ledger posting, no '
  'FINALIZED settlement) — P5.7E-LOCK §6/§11.';
