-- ============================================================
-- KIRAYA
-- P2.9: WhatsApp tenant isolation
-- ============================================================


drop policy if exists whatsapp_messages_select
on kiraya.whatsapp_messages;


create policy whatsapp_messages_select
on kiraya.whatsapp_messages
for select
to authenticated
using (
    kiraya.can_access_organization(
        organization_id
    )

    or exists (
        select 1
        from kiraya.tenants t
        where t.id = whatsapp_messages.tenant_id
          and t.organization_id = whatsapp_messages.organization_id
          and kiraya.is_tenant_user(
              t.id
          )
    )
);