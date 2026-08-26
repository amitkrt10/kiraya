-- ============================================================
-- KIRAYA
-- P6.3-H Fix 3: server-side ACTIVE-tenant assignment enforcement
--
-- Problem (P6.3-G audit): getActiveTenantsForPicker() filters the UI's
-- tenant picker to status = 'ACTIVE', but kiraya.create_tenant_unit_
-- assignment() never independently checks the tenant's own status --
-- only organization membership (transitively, via the leases INSERT's
-- validate_lease_organization() trigger) and unit vacancy. A caller
-- invoking the RPC directly (bypassing the UI picker) could therefore
-- assign a unit to an INACTIVE or ARCHIVED tenant.
--
-- Fix: look up the tenant's own status inside the function, before any
-- write, and reject anything other than ACTIVE with the same clean,
-- authored-exception convention already used for the vacancy check two
-- lines above it (errcode 23514, a short plain-English message with no
-- quotes/underscores so translateDatabaseError() passes it through
-- unmodified). A tenant id that doesn't resolve at all (wrong org, or
-- genuinely nonexistent) reads as "not found" rather than a distinct
-- "wrong status" error -- consistent with how every other not-found
-- case in this schema avoids leaking cross-org existence -- and this
-- lookup is `security invoker`, so it is itself RLS-scoped exactly like
-- every other read in this function: a cross-org tenant id is invisible
-- to it, not merely mismatched.
--
-- Everything else about create_tenant_unit_assignment() is unchanged:
-- still one atomic PL/pgSQL call, still security invoker, still backed
-- by leases_unit_active_unique_idx as the actual concurrency guarantee
-- for vacancy, still never touches tenant demographic data.
--
-- Data safety: this only affects the body of a function invoked on new
-- assignment attempts -- it is not a table constraint and cannot reject
-- any existing row. Verified on local dev data before writing this:
-- all 9 seeded tenants are ACTIVE, so no existing fixture or workflow
-- is affected.
-- ============================================================

create or replace function kiraya.create_tenant_unit_assignment(
    p_organization_id uuid,
    p_tenant_id uuid,
    p_unit_id uuid,
    p_occupancy_start_date date,
    p_rent_rule_name text,
    p_monthly_rent numeric,
    p_occupancy_notes text default null,
    p_billing_frequency kiraya.billing_frequency default 'MONTHLY',
    p_billing_day smallint default 1,
    p_proration_method kiraya.proration_method default 'CALENDAR_DAYS',
    p_first_bill_prorate boolean default true,
    p_final_bill_prorate boolean default true,
    p_bill_in_advance boolean default false,
    p_due_days_after_bill smallint default 0,
    p_deposit_required_amount numeric default null,
    p_deposit_reference text default null,
    p_deposit_notes text default null
)
returns kiraya.leases
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_lease kiraya.leases%rowtype;
    v_lease_code text;
    v_deposit_reference text;
    v_tenant_status kiraya.tenant_status;
begin

    select status into v_tenant_status
    from kiraya.tenants
    where id = p_tenant_id;

    if v_tenant_status is null then
        raise exception
            using
                errcode = '23503',
                message = 'Tenant does not exist.';
    end if;

    if v_tenant_status is distinct from 'ACTIVE' then
        raise exception
            using
                errcode = '23514',
                message = 'This tenant is not active and cannot be assigned to a unit.';
    end if;

    if not kiraya.unit_is_assignable(p_unit_id) then
        raise exception
            using
                errcode = '23514',
                message = 'This unit is not currently assignable (already occupied, or marked maintenance/unavailable).';
    end if;

    v_lease_code := kiraya.generate_sequential_reference('LSE');

    insert into kiraya.leases (
        organization_id,
        tenant_id,
        unit_id,
        lease_code,
        status,
        agreement_start_date,
        occupancy_start_date,
        notes
    )
    values (
        p_organization_id,
        p_tenant_id,
        p_unit_id,
        v_lease_code,
        'ACTIVE',
        p_occupancy_start_date,
        p_occupancy_start_date,
        p_occupancy_notes
    )
    returning * into v_lease;

    insert into kiraya.lease_rent_rules (
        organization_id,
        lease_id,
        rule_name,
        monthly_rent,
        effective_from
    )
    values (
        v_lease.organization_id,
        v_lease.id,
        p_rent_rule_name,
        p_monthly_rent,
        p_occupancy_start_date
    );

    insert into kiraya.lease_billing_configs (
        organization_id,
        lease_id,
        billing_frequency,
        billing_day,
        proration_method,
        first_bill_prorate,
        final_bill_prorate,
        bill_in_advance,
        due_days_after_bill,
        effective_from
    )
    values (
        v_lease.organization_id,
        v_lease.id,
        p_billing_frequency,
        p_billing_day,
        p_proration_method,
        p_first_bill_prorate,
        p_final_bill_prorate,
        p_bill_in_advance,
        p_due_days_after_bill,
        p_occupancy_start_date
    );

    if p_deposit_required_amount is not null then
        v_deposit_reference := coalesce(p_deposit_reference, kiraya.generate_sequential_reference('DEP'));

        insert into kiraya.security_deposits (
            organization_id,
            lease_id,
            tenant_id,
            deposit_reference,
            required_amount,
            notes
        )
        values (
            v_lease.organization_id,
            v_lease.id,
            v_lease.tenant_id,
            v_deposit_reference,
            p_deposit_required_amount,
            p_deposit_notes
        );
    end if;

    return v_lease;
end;
$$;

comment on function kiraya.create_tenant_unit_assignment(
    uuid, uuid, uuid, date, text, numeric, text,
    kiraya.billing_frequency, smallint, kiraya.proration_method,
    boolean, boolean, boolean, smallint,
    numeric, text, text
) is
    'P6.3-B (P6.3-H Fix 3): atomically creates a complete Tenant-Unit occupancy (lease + initial rent rule + billing configuration + optional security deposit) in one transaction. Never creates or modifies a tenant. Requires the tenant to exist (RLS-visible to the caller) and be status = ACTIVE. Vacancy precondition is kiraya.unit_is_assignable(); leases_unit_active_unique_idx remains the actual concurrency guarantee.';
