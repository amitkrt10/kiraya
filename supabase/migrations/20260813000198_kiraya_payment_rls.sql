-- ============================================================
-- KIRAYA
-- Migration: payment RLS
-- ============================================================


-- ------------------------------------------------------------
-- Payments
--
-- Tenant:
--   Can see own payments.
--   Cannot create / edit payments.
--
-- Organization:
--   Can manage payments with WRITE permission.
-- ------------------------------------------------------------

create policy payments_select
on kiraya.payments
for select
to authenticated
using (
    kiraya.can_access_tenant(
        organization_id,
        tenant_id
    )
);


create policy payments_insert
on kiraya.payments
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy payments_update
on kiraya.payments
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Payment allocations
-- ------------------------------------------------------------

create policy payment_allocations_select
on kiraya.payment_allocations
for select
to authenticated
using (
    exists (
        select 1
        from kiraya.payments p
        where p.id = payment_id
          and kiraya.can_access_tenant(
              p.organization_id,
              p.tenant_id
          )
    )
);


create policy payment_allocations_insert
on kiraya.payment_allocations
for insert
to authenticated
with check (
    exists (
        select 1
        from kiraya.payments p
        where p.id = payment_id
          and kiraya.can_write_organization(
              p.organization_id
          )
    )
);


create policy payment_allocations_update
on kiraya.payment_allocations
for update
to authenticated
using (
    exists (
        select 1
        from kiraya.payments p
        where p.id = payment_id
          and kiraya.can_write_organization(
              p.organization_id
          )
)
with check (
    exists (
        select 1
        from kiraya.payments p
        where p.id = payment_id
          and kiraya.can_write_organization(
              p.organization_id
          )
);