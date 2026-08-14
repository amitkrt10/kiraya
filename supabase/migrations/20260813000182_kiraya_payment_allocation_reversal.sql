-- ============================================================
-- KIRAYA
-- Migration: payment allocation reversal
--
-- Purpose:
-- Reverses the financial effect of all allocations belonging
-- to a payment.
--
-- Allocation records themselves remain historical.
-- Reversal entries are added to the ledger.
-- ============================================================

create or replace function kiraya.reverse_payment_allocations(
    p_payment_id uuid,
    p_reversed_by uuid,
    p_reason text
)
returns integer
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_allocation record;
    v_count integer := 0;
begin

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

        /*
         * Avoid creating duplicate allocation reversals.
         */
        if not exists (
            select 1
            from kiraya.ledger_entries le
            where le.payment_id = p_payment_id
              and le.bill_id = v_allocation.bill_id
              and le.entry_type = 'ALLOCATION_REVERSAL'
              and le.is_reversal = true
              and le.metadata ->> 'allocation_id'
                  = v_allocation.id::text
        ) then

            insert into kiraya.ledger_entries (
                organization_id,
                tenant_id,
                lease_id,
                bill_id,
                payment_id,
                entry_type,
                entry_date,
                description,
                debit_amount,
                credit_amount,
                currency_code,
                reference_code,
                is_reversal,
                created_by,
                metadata
            )
            select
                pa.organization_id,
                b.tenant_id,
                b.lease_id,
                pa.bill_id,
                pa.payment_id,
                'ALLOCATION_REVERSAL',
                current_date,
                'Reversal of payment allocation to '
                    || v_allocation.bill_number
                    || ': '
                    || trim(p_reason),
                pa.allocated_amount,
                0,
                b.currency_code,
                v_allocation.id::text,
                true,
                p_reversed_by,
                jsonb_build_object(
                    'allocation_id',
                    v_allocation.id,
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


comment on function kiraya.reverse_payment_allocations(uuid, uuid, text) is
    'Creates financial reversal entries for all allocations belonging to a payment.';