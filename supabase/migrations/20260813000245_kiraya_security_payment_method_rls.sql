-- ============================================================
-- KIRAYA
-- P2.7: payment method RLS
-- ============================================================


drop policy if exists payment_methods_select
on kiraya.payment_methods;


create policy payment_methods_select
on kiraya.payment_methods
for select
to authenticated
using (
    organization_id is null
    or kiraya.can_access_organization(
        organization_id
    )
    or exists (
        select 1
        from kiraya.payments p
        where p.payment_method_id = payment_methods.id
          and kiraya.is_tenant_user(
              p.tenant_id
          )
    )
);