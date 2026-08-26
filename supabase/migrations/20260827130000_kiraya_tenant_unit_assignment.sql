-- ============================================================
-- KIRAYA
-- P6.3-B: atomic Tenant -> Unit assignment
--
-- kiraya.create_tenant_unit_assignment() creates a complete
-- occupancy in one transaction: the lease/occupancy record itself,
-- its initial rent rule, its billing configuration, and (optionally)
-- its security deposit. A PL/pgSQL function body is already
-- transactional -- any exception raised anywhere inside it (an
-- explicit check here, or any trigger/constraint fired by one of
-- the INSERTs) unwinds every change the function made, including
-- ones from earlier statements in the same call. No explicit
-- transaction control or savepoints are needed for that guarantee,
-- and none are used here.
--
-- Never creates or modifies a tenant -- p_tenant_id must already
-- exist; kiraya.validate_lease_organization() (fired by the leases
-- INSERT below) is what confirms it actually does and belongs to
-- p_organization_id, exactly the same way it already guards
-- app/app/leases/new today. No tenant demographic field is
-- accepted or touched by this function at all.
--
-- Vacancy: kiraya.unit_is_assignable() is checked first purely for
-- a clean, specific error message in the common case (occupied /
-- maintenance / unavailable) -- the actual concurrency guarantee
-- against two simultaneous callers is leases_unit_active_unique_idx,
-- which the leases INSERT below is still fully subject to
-- regardless of what this precondition found.
--
-- security invoker (not definer): every write below still goes
-- through its own table's ordinary can_write_organization()-gated
-- RLS policy exactly as if the four INSERTs had been issued
-- directly -- this function grants no privilege a caller didn't
-- already have, and cannot be used to bypass organization
-- membership. See the P6.3-B report for the full RLS walkthrough.
--
-- Lease/rent-rule/billing-config/deposit "codes" the user never
-- picks (lease_code, deposit_reference when not supplied) reuse
-- kiraya.generate_sequential_reference() -- the same P5.18
-- mechanism tenant_exits/exit_settlements/deposit_refunds already
-- use for exactly this "never surfaced to the user, never supplied
-- by application code" purpose.
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
begin

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
    'P6.3-B: atomically creates a complete Tenant-Unit occupancy (lease + initial rent rule + billing configuration + optional security deposit) in one transaction. Never creates or modifies a tenant. Vacancy precondition is kiraya.unit_is_assignable(); leases_unit_active_unique_idx remains the actual concurrency guarantee.';
