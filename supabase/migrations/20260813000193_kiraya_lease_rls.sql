-- ============================================================
-- KIRAYA
-- Migration: lease RLS
-- ============================================================


-- ------------------------------------------------------------
-- Leases
-- ------------------------------------------------------------

create policy leases_select
on kiraya.leases
for select
to authenticated
using (
    kiraya.can_access_tenant(
        organization_id,
        tenant_id
    )
);


create policy leases_insert
on kiraya.leases
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy leases_update
on kiraya.leases
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Lease parties
-- ------------------------------------------------------------

create policy lease_parties_select
on kiraya.lease_parties
for select
to authenticated
using (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_access_tenant(
              l.organization_id,
              l.tenant_id
          )
    )
);


create policy lease_parties_insert
on kiraya.lease_parties
for insert
to authenticated
with check (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_write_organization(
              l.organization_id
          )
    )
);


create policy lease_parties_update
on kiraya.lease_parties
for update
to authenticated
using (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_write_organization(
              l.organization_id
          )
    )
)
with check (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_write_organization(
              l.organization_id
          )
    )
);


-- ------------------------------------------------------------
-- Rent rules
-- ------------------------------------------------------------

create policy lease_rent_rules_select
on kiraya.lease_rent_rules
for select
to authenticated
using (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_access_tenant(
              l.organization_id,
              l.tenant_id
          )
    )
);


create policy lease_rent_rules_insert
on kiraya.lease_rent_rules
for insert
to authenticated
with check (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_write_organization(
              l.organization_id
          )
    )
);


create policy lease_rent_rules_update
on kiraya.lease_rent_rules
for update
to authenticated
using (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_write_organization(
              l.organization_id
          )
    )
)
with check (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_write_organization(
              l.organization_id
          )
    )
);


-- ------------------------------------------------------------
-- Lease billing configuration
-- ------------------------------------------------------------

create policy lease_billing_configs_select
on kiraya.lease_billing_configs
for select
to authenticated
using (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_access_tenant(
              l.organization_id,
              l.tenant_id
          )
    )
);


create policy lease_billing_configs_insert
on kiraya.lease_billing_configs
for insert
to authenticated
with check (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_write_organization(
              l.organization_id
          )
    )
);


create policy lease_billing_configs_update
on kiraya.lease_billing_configs
for update
to authenticated
using (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_write_organization(
              l.organization_id
          )
    )
)
with check (
    exists (
        select 1
        from kiraya.leases l
        where l.id = lease_id
          and kiraya.can_write_organization(
              l.organization_id
          )
    )
);