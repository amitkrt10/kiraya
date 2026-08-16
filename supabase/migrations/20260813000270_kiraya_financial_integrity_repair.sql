-- ============================================================
-- KIRAYA
-- P0/P1 repair: payment allocation validation + bill status sync
-- ============================================================

create or replace function kiraya.validate_payment_allocation()
returns trigger
language plpgsql security invoker
set search_path = kiraya, public
as $$
declare
    payment_amount numeric(18,2);
    already_allocated numeric(18,2);
    bill_total numeric(18,2);
    bill_allocated numeric(18,2);
    payment_organization_id uuid;
    bill_organization_id uuid;
begin
    select amount,organization_id into payment_amount,payment_organization_id
    from kiraya.payments where id=new.payment_id;
    if payment_amount is null then raise exception using errcode='23503',message='Payment does not exist.'; end if;
    if payment_organization_id is distinct from new.organization_id then raise exception using errcode='23514',message='Payment allocation organization mismatch.'; end if;

    select coalesce(sum(pa.allocated_amount),0) into already_allocated
    from kiraya.payment_allocations pa
    join kiraya.payments p on p.id=pa.payment_id
    where pa.payment_id=new.payment_id and pa.id<>new.id and p.status='POSTED'
      and not exists (select 1 from kiraya.ledger_entries le where le.entry_type='ALLOCATION_REVERSAL' and le.is_reversal=true and le.metadata->>'allocation_id'=pa.id::text);
    if already_allocated + new.allocated_amount > payment_amount then
        raise exception using errcode='23514',message='Payment allocation exceeds payment amount.';
    end if;

    select total_amount,organization_id into bill_total,bill_organization_id
    from kiraya.bills where id=new.bill_id;
    if bill_total is null then raise exception using errcode='23503',message='Bill does not exist.'; end if;
    if bill_organization_id is distinct from new.organization_id then raise exception using errcode='23514',message='Bill allocation organization mismatch.'; end if;

    select coalesce(sum(pa.allocated_amount),0) into bill_allocated
    from kiraya.payment_allocations pa
    join kiraya.payments p on p.id=pa.payment_id
    where pa.bill_id=new.bill_id and pa.id<>new.id and p.status='POSTED'
      and not exists (select 1 from kiraya.ledger_entries le where le.entry_type='ALLOCATION_REVERSAL' and le.is_reversal=true and le.metadata->>'allocation_id'=pa.id::text);
    if bill_allocated + new.allocated_amount > bill_total then
        raise exception using errcode='23514',message='Payment allocation exceeds bill balance.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_validate_payment_allocation on kiraya.payment_allocations;
create trigger trg_validate_payment_allocation before insert or update on kiraya.payment_allocations
for each row execute function kiraya.validate_payment_allocation();

create or replace function kiraya.sync_bill_payment_status(p_bill_id uuid)
returns void
language plpgsql security invoker
set search_path = kiraya, public
as $$
declare
    v_bill kiraya.bills%rowtype;
    v_paid numeric(18,2);
begin
    select * into v_bill from kiraya.bills where id=p_bill_id for update;
    if not found or v_bill.status in('DRAFT','VOID') then return; end if;
    v_paid=kiraya.get_bill_paid_amount(p_bill_id);
    perform set_config('kiraya.financial_context','1',true);
    update kiraya.bills set status=case
        when v_paid <= 0 then 'FINALIZED'::kiraya.bill_status
        when v_paid < v_bill.total_amount then 'PARTIALLY_PAID'::kiraya.bill_status
        else 'PAID'::kiraya.bill_status end,
        updated_at=now() where id=p_bill_id;
end;
$$;

create or replace function kiraya.handle_bill_payment_allocation()
returns trigger language plpgsql security invoker
set search_path=kiraya,public as $$
begin perform kiraya.sync_bill_payment_status(new.bill_id); return new; end;
$$;

drop trigger if exists trg_handle_bill_payment_allocation on kiraya.payment_allocations;
create trigger trg_handle_bill_payment_allocation after insert on kiraya.payment_allocations
for each row execute function kiraya.handle_bill_payment_allocation();
