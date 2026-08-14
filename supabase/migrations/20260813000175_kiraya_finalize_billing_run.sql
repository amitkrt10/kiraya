-- ============================================================
-- KIRAYA
-- Migration: finalize billing run
--
-- Purpose:
-- Finalizes all draft bills belonging to a billing run.
--
-- Each bill is finalized individually so one failure does
-- not silently corrupt another bill.
-- ============================================================

create or replace function kiraya.finalize_billing_run(
    p_billing_run_id uuid,
    p_finalized_by uuid
)
returns integer
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_bill kiraya.bills%rowtype;
    v_count integer := 0;
begin

    for v_bill in
        select *
        from kiraya.bills
        where billing_run_id = p_billing_run_id
          and status = 'DRAFT'
        order by bill_number
        for update
    loop

        perform kiraya.finalize_bill(
            v_bill.id,
            p_finalized_by
        );

        v_count := v_count + 1;

    end loop;


    update kiraya.billing_runs
    set
        status = 'FINALIZED',
        completed_at = coalesce(
            completed_at,
            now()
        ),
        updated_at = now()
    where id = p_billing_run_id;


    return v_count;
end;
$$;


comment on function kiraya.finalize_billing_run(uuid, uuid) is
    'Finalizes all draft bills belonging to a billing run.';