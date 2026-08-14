-- ============================================================
-- KIRAYA
-- Migration: generate billing run
--
-- Purpose:
-- Creates draft bills for all eligible active leases.
--
-- This is the database foundation for:
--
-- "Generate bills for this property/month"
--
-- The application can subsequently review the drafts and
-- finalize them in bulk.
-- ============================================================

create or replace function kiraya.generate_billing_run(
    p_organization_id uuid,
    p_period_start date,
    p_period_end date,
    p_bill_date date,
    p_due_date date default null,
    p_property_id uuid default null,
    p_initiated_by uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_run_id uuid;
    v_run_code text;
    v_lease kiraya.leases%rowtype;
    v_bill_id uuid;
    v_total integer := 0;
    v_success integer := 0;
    v_failed integer := 0;
begin

    if p_period_end < p_period_start then
        raise exception
            using
                errcode = '22007',
                message = 'Billing period is invalid.';
    end if;

    v_run_code :=
        'RUN-'
        || to_char(p_bill_date, 'YYYYMMDD')
        || '-'
        || upper(substr(
            replace(gen_random_uuid()::text, '-', ''),
            1,
            8
        ));

    insert into kiraya.billing_runs (
        organization_id,
        property_id,
        run_code,
        period_start,
        period_end,
        bill_date,
        due_date,
        status,
        initiated_by,
        started_at
    )
    values (
        p_organization_id,
        p_property_id,
        v_run_code,
        p_period_start,
        p_period_end,
        p_bill_date,
        p_due_date,
        'RUNNING',
        p_initiated_by,
        now()
    )
    returning id into v_run_id;


    for v_lease in
        select l.*
        from kiraya.leases l
        join kiraya.units u
            on u.id = l.unit_id
        where l.organization_id = p_organization_id
          and l.status = 'ACTIVE'
          and (
              p_property_id is null
              or u.property_id = p_property_id
          )
          and l.occupancy_start_date <= p_period_end
          and (
              l.actual_end_date is null
              or l.actual_end_date >= p_period_start
          )
    loop

        v_total := v_total + 1;

        begin

            v_bill_id :=
                kiraya.generate_bill(
                    v_lease.id,
                    p_period_start,
                    p_period_end,
                    p_bill_date,
                    p_due_date,
                    v_run_id,
                    p_initiated_by
                );

            v_success := v_success + 1;

        exception
            when others then

                v_failed := v_failed + 1;

                insert into kiraya.audit_logs (
                    organization_id,
                    actor_profile_id,
                    action,
                    resource_type,
                    resource_id,
                    description,
                    new_data
                )
                values (
                    p_organization_id,
                    p_initiated_by,
                    'BILL_GENERATION_FAILED',
                    'LEASE',
                    v_lease.id,
                    sqlerrm,
                    jsonb_build_object(
                        'period_start', p_period_start,
                        'period_end', p_period_end,
                        'bill_date', p_bill_date
                    )
                );

        end;

    end loop;


    update kiraya.billing_runs
    set
        total_bills = v_total,
        successful_bills = v_success,
        failed_bills = v_failed,
        status = case
            when v_failed = 0
                then 'COMPLETED'::kiraya.billing_run_status
            when v_success > 0
                then 'PARTIAL'::kiraya.billing_run_status
            else
                'FAILED'::kiraya.billing_run_status
        end,
        completed_at = now(),
        updated_at = now()
    where id = v_run_id;


    return v_run_id;
end;
$$;


comment on function kiraya.generate_billing_run(
    uuid,
    date,
    date,
    date,
    date,
    uuid,
    uuid
) is
    'Generates draft bills for all eligible leases within an organization or property.';