-- ============================================================
-- KIRAYA
-- Migration: WhatsApp message RLS
-- ============================================================


-- ------------------------------------------------------------
-- WhatsApp messages
--
-- Tenants can see the history of messages associated with
-- their own tenant.
--
-- They cannot send, edit, retry, or delete messages.
-- ------------------------------------------------------------

create policy whatsapp_messages_select
on kiraya.whatsapp_messages
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
    or (
        tenant_id is not null
        and kiraya.is_tenant_user(tenant_id)
    )
);


create policy whatsapp_messages_insert
on kiraya.whatsapp_messages
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy whatsapp_messages_update
on kiraya.whatsapp_messages
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);