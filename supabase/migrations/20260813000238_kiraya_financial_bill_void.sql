-- ============================================================
-- KIRAYA
-- P1/P2 repair: safe bill voiding
-- ============================================================

create or replace function kiraya.void_bill(
    p_bill_id uuid,
    p_voided_by uuid,
    p_reason text
)
returns kiraya.bills
language plpgsql
security invoker
set search_path = kiraya, public
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

    if v_bill.status = 'VOID' then return v_bill; end if;

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
          where le.entry_type='ALLOCATION_REVERSAL'
            and le.is_reversal=true
            and le.metadata ->> 'allocation_id' = pa.id::text
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
    set status='VOID',
        updated_at=now(),
        metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
            'voided_at',now(), 'voided_by',p_voided_by, 'void_reason',trim(p_reason)
        )
    where id=p_bill_id
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
           jsonb_build_object('reason',trim(p_reason),'voided_bill_id',p_bill_id)
    from kiraya.ledger_entries le
    where le.bill_id=p_bill_id
      and le.entry_type='BILL'
      and le.is_reversal=false
      and not exists (
          select 1 from kiraya.ledger_entries reversal
          where reversal.reverses_entry_id=le.id and reversal.is_reversal=true
      );

    return v_bill;
end;
$$;

revoke all on function kiraya.void_bill(uuid,uuid,text) from public;
