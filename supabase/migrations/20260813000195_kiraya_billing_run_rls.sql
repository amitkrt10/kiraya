-- ============================================================
-- KIRAYA
-- Migration: billing run RLS
-- ============================================================


-- ------------------------------------------------------------
-- Billing runs
-- ------------------------------------------------------------

create policy billing_runs_select
on kiraya.billing_runs
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);


create policy billing_runs_insert
on kiraya.billing_runs
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy billing_runs_update
on kiraya.billing_runs
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);