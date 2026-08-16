-- ============================================================
-- KIRAYA
-- Migration: bill RLS
-- ============================================================


create policy bills_select
on kiraya.bills
for select
to authenticated
using (
    kiraya.can_access_tenant(
        organization_id,
        tenant_id
    )
);


create policy bills_insert
on kiraya.bills
for insert
to authenticated
with check (
    kiraya.can_write_organization(
        organization_id
    )
);


create policy bills_update
on kiraya.bills
for update
to authenticated
using (
    kiraya.can_write_organization(
        organization_id
    )
)
with check (
    kiraya.can_write_organization(
        organization_id
    )
);


-- ------------------------------------------------------------
-- Bill items
-- ------------------------------------------------------------

create policy bill_items_select
on kiraya.bill_items
for select
to authenticated
using (
    exists (
        select 1
        from kiraya.bills b
        where b.id = bill_id
          and kiraya.can_access_tenant(
              b.organization_id,
              b.tenant_id
          )
    )
);


create policy bill_items_insert
on kiraya.bill_items
for insert
to authenticated
with check (
    exists (
        select 1
        from kiraya.bills b
        where b.id = bill_id
          and kiraya.can_write_organization(
              b.organization_id
          )
    )
);


create policy bill_items_update
on kiraya.bill_items
for update
to authenticated
using (
    exists (
        select 1
        from kiraya.bills b
        where b.id = bill_id
          and kiraya.can_write_organization(
              b.organization_id
          )
    )
)
with check (
    exists (
        select 1
        from kiraya.bills b
        where b.id = bill_id
          and kiraya.can_write_organization(
              b.organization_id
          )
    )
);


-- ------------------------------------------------------------
-- Bill adjustments
-- ------------------------------------------------------------

create policy bill_adjustments_select
on kiraya.bill_adjustments
for select
to authenticated
using (
    exists (
        select 1
        from kiraya.bills b
        where b.id = bill_id
          and kiraya.can_access_tenant(
              b.organization_id,
              b.tenant_id
          )
    )
);


create policy bill_adjustments_insert
on kiraya.bill_adjustments
for insert
to authenticated
with check (
    exists (
        select 1
        from kiraya.bills b
        where b.id = bill_id
          and kiraya.can_write_organization(
              b.organization_id
          )
    )
);


create policy bill_adjustments_update
on kiraya.bill_adjustments
for update
to authenticated
using (
    exists (
        select 1
        from kiraya.bills b
        where b.id = bill_id
          and kiraya.can_write_organization(
              b.organization_id
          )
    )
)
with check (
    exists (
        select 1
        from kiraya.bills b
        where b.id = bill_id
          and kiraya.can_write_organization(
              b.organization_id
          )
    )
);