-- ============================================================
-- KIRAYA
-- P1.7: payment allocation reversal
-- ============================================================


create or replace function kiraya.reverse_payment_allocations(
    p_payment_id uuid,
    p_reversed_by uuid,
    p_reason text
)
returns integer
language plpgsql
security definer
set search_path = kiraya, public
as $$
declare
    v_allocation record;
    v_count integer := 0;
begin

    if p_reason is null
       or length(trim(p_reason)) = 0 then
        raise exception
            using
                errcode = '22023',
                message = 'A reason is required to reverse payment allocations.';
    end if;


    for v_allocation in
        select
            pa.*,
            b.bill_number
        from kiraya.payment_allocations pa
        join kiraya.bills b
            on b.id = pa.bill_id
        where pa.payment_id = p_payment_id
        order by pa.created_at
    loop

        if not exists (
            select 1
            from kiraya.ledger_entries le
            where le.payment_allocation_id = v_allocation.id
              and le.entry_type = 'ALLOCATION_REVERSAL'
              and le.is_reversal = true
        ) then

            insert into kiraya.ledger_entries (
                organization_id,
                tenant_id,
                lease_id,
                bill_id,
                payment_id,
                payment_allocation_id,
                entry_type,
                entry_date,
                description,
                debit_amount,
                credit_amount,
                currency_code,
                reference_code,
                is_reversal,
                reverses_entry_id,
                created_by,
                metadata
            )
            select
                pa.organization_id,
                b.tenant_id,
                b.lease_id,
                pa.bill_id,
                pa.payment_id,
                pa.id,
                'ALLOCATION_REVERSAL',
                current_date,
                'Reversal of payment allocation to '
                    || b.bill_number
                    || ': '
                    || trim(p_reason),
                pa.allocated_amount,
                0,
                b.currency_code,
                pa.id::text,
                true,
                (
                    select le.id
                    from kiraya.ledger_entries le
                    where le.payment_allocation_id = pa.id
                      and le.entry_type = 'PAYMENT_ALLOCATION'
                      and le.is_reversal = false
                    order by le.created_at
                    limit 1
                ),
                p_reversed_by,
                jsonb_build_object(
                    'allocation_id',
                    pa.id,
                    'reason',
                    trim(p_reason)
                )
            from kiraya.payment_allocations pa
            join kiraya.bills b
                on b.id = pa.bill_id
            where pa.id = v_allocation.id;


            v_count := v_count + 1;

        end if;

    end loop;


    return v_count;
end;
$$;


revoke all
on function kiraya.reverse_payment_allocations(
    uuid,
    uuid,
    text
)
from public;


comment on function kiraya.reverse_payment_allocations(uuid, uuid, text) is
    'Creates immutable reversal entries linked to each payment allocation.';