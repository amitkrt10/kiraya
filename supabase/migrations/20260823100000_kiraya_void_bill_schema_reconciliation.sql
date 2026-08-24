-- ============================================================
-- KIRAYA
-- P5.9: schema source-of-truth reconciliation for
-- kiraya.void_bill(uuid, uuid, text)
--
-- This is documentation-only. It changes NOTHING about live
-- behavior -- the function body below is reproduced verbatim
-- (byte-for-byte, confirmed via `supabase db dump --linked`)
-- from what is already running in production today.
--
-- Background (P5.8C, confirmed again here in P5.9): the most
-- recent committed migration touching this function,
-- 20260813000272_kiraya_financial_void_authorization.sql, adds
-- the intended kiraya.can_write_organization() authorization
-- check but -- in the same edit -- replaces the entire working
-- bill-void business logic with a same-signature recursive
-- self-call (`return kiraya.void_bill(p_bill_id, p_voided_by,
-- p_reason);`), discarding every check that
-- 20260813000238_kiraya_financial_bill_void.sql had already
-- established (reason-required, PAID/PARTIALLY_PAID rejection,
-- active-payment-allocation guard, tenant-credit-application
-- guard, financial_context handling, and the anti-joined ledger
-- REVERSAL insert). Applied literally, 000272's function would
-- recurse unconditionally on every call.
--
-- The live database does not exhibit this bug. Its
-- kiraya.void_bill() is exactly 000238's business logic with
-- 000272's authorization check correctly inserted (immediately
-- after the bill-existence lookup, before the VOID-status
-- short-circuit), running as SECURITY DEFINER with
-- row_security=off -- consistent with every other explicitly
-- can_write_organization()-gated financial function in this
-- schema. How or when the live function was corrected relative
-- to 000272's committed content is unknown and unrecoverable
-- from available evidence; it is not guessed at here.
--
-- This migration exists solely so that a fresh database built
-- from this repository's migrations would end up with the same
-- kiraya.void_bill() the live database already has. It does not
-- change authorization semantics, financial checks, ledger
-- behavior, or error codes -- every clause below already exists,
-- unmodified, in the live function.
--
-- Note: this migration does not by itself resolve the separate
-- `supabase db diff --linked` shadow-replay failure at
-- 20260813000238 (SQLSTATE 42P13, "cannot change return type of
-- existing function" -- 000173 originally returned uuid, 000238
-- changes it to kiraya.bills via CREATE OR REPLACE FUNCTION
-- without an intervening DROP). Fixing that requires editing an
-- already-applied historical migration, which is out of scope
-- here; see the P5.9 report, section 8.
-- ============================================================

create or replace function kiraya.void_bill(
    p_bill_id uuid,
    p_voided_by uuid,
    p_reason text
)
returns kiraya.bills
language plpgsql
security definer
set search_path = kiraya, public
set row_security = off
as $$
declare
    v_bill kiraya.bills%rowtype;
    v_active_allocations numeric(18,2);
    v_credit_applications numeric(18,2);
begin
    if p_reason is null or length(trim(p_reason)) = 0 then
        raise exception using errcode='22023', message='A reason is required to void a bill.';
    end if;

    select * into v_bill from kiraya.bills where id = p_bill_id for update;
    if not found then
        raise exception using errcode='23503', message='Bill does not exist.';
    end if;

    if not kiraya.can_write_organization(v_bill.organization_id) then
        raise exception using errcode='42501', message='Not authorized to void bills in this organization.';
    end if;

    if v_bill.status = 'VOID' then
        return v_bill;
    end if;

    if v_bill.status in ('PAID','PARTIALLY_PAID') then
        raise exception using errcode='23514', message='Paid or partially paid bills cannot be voided directly. Reverse the relevant payments first.';
    end if;

    select coalesce(sum(pa.allocated_amount),0) into v_active_allocations
    from kiraya.payment_allocations pa
    join kiraya.payments p on p.id = pa.payment_id
    where pa.bill_id = p_bill_id
      and p.status = 'POSTED'
      and not exists (
          select 1 from kiraya.ledger_entries le
          where le.entry_type = 'ALLOCATION_REVERSAL'
            and le.is_reversal = true
            and le.metadata->>'allocation_id' = pa.id::text
      );

    if v_active_allocations > 0 then
        raise exception using errcode='23514', message='Bill has active payment allocations and cannot be voided.';
    end if;

    select coalesce(sum(le.debit_amount),0) into v_credit_applications
    from kiraya.ledger_entries le
    where le.bill_id = p_bill_id
      and le.entry_type = 'CREDIT_APPLICATION'
      and le.is_reversal = false;

    if v_credit_applications > 0 then
        raise exception using errcode='23514', message='Bill has tenant-credit applications and cannot be voided directly.';
    end if;

    perform set_config('kiraya.financial_context','1',true);

    update kiraya.bills
    set status = 'VOID',
        updated_at = now(),
        metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
            'voided_at', now(), 'voided_by', p_voided_by, 'void_reason', trim(p_reason)
        )
    where id = p_bill_id
    returning * into v_bill;

    insert into kiraya.ledger_entries (
        organization_id, tenant_id, lease_id, bill_id, entry_type,
        entry_date, description, debit_amount, credit_amount,
        currency_code, reference_code, is_reversal, reverses_entry_id,
        created_by, metadata
    )
    select le.organization_id, le.tenant_id, le.lease_id, le.bill_id,
           'REVERSAL', current_date,
           'Reversal of voided bill ' || v_bill.bill_number,
           le.credit_amount, le.debit_amount, le.currency_code,
           v_bill.bill_number, true, le.id, p_voided_by,
           jsonb_build_object('reason', trim(p_reason), 'voided_bill_id', p_bill_id)
    from kiraya.ledger_entries le
    where le.bill_id = p_bill_id
      and le.entry_type = 'BILL'
      and le.is_reversal = false
      and not exists (
          select 1 from kiraya.ledger_entries reversal
          where reversal.reverses_entry_id = le.id and reversal.is_reversal = true
      );

    return v_bill;
end;
$$;
