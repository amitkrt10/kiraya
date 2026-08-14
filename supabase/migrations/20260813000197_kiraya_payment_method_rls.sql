-- ============================================================
-- KIRAYA
-- Migration: payment method RLS
-- ============================================================


-- ------------------------------------------------------------
-- Payment methods
--
-- Cash / Online / Discount are defaults.
-- Organizations may add their own methods.
-- ------------------------------------------------------------

create policy payment_methods_select
on kiraya.payment_methods
for select
to authenticated
using (
    organization_id is null
    or kiraya.can_access_organization(organization_id)
);


create policy payment_methods_insert
on kiraya.payment_methods
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy payment_methods_update
on kiraya.payment_methods
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);