-- ============================================================
-- KIRAYA
-- Migration: whatsapp_messages
--
-- Purpose:
-- Tracks WhatsApp bill/message delivery.
--
-- Actual WhatsApp provider integration will be handled by the
-- application/Edge Function layer.
-- ============================================================

create table kiraya.whatsapp_messages (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    tenant_id uuid
        references kiraya.tenants(id)
        on delete restrict,

    bill_id uuid
        references kiraya.bills(id)
        on delete restrict,

    document_id uuid
        references kiraya.documents(id)
        on delete restrict,

    recipient_phone text
        not null,

    message_type text
        not null default 'BILL',

    provider text,

    provider_message_id text,

    status kiraya.message_status
        not null default 'QUEUED',

    queued_at timestamptz
        not null default now(),

    sent_at timestamptz,

    delivered_at timestamptz,

    read_at timestamptz,

    failed_at timestamptz,

    failure_reason text,

    retry_count integer
        not null default 0,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint whatsapp_messages_phone_check
        check (length(trim(recipient_phone)) > 0),

    constraint whatsapp_messages_type_check
        check (length(trim(message_type)) > 0),

    constraint whatsapp_messages_retry_check
        check (retry_count >= 0),

    constraint whatsapp_messages_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create index whatsapp_messages_organization_idx
    on kiraya.whatsapp_messages (organization_id);

create index whatsapp_messages_tenant_idx
    on kiraya.whatsapp_messages (tenant_id);

create index whatsapp_messages_bill_idx
    on kiraya.whatsapp_messages (bill_id);

create index whatsapp_messages_status_idx
    on kiraya.whatsapp_messages (
        organization_id,
        status
    );

create index whatsapp_messages_provider_id_idx
    on kiraya.whatsapp_messages (provider_message_id)
    where provider_message_id is not null;

comment on table kiraya.whatsapp_messages is
    'WhatsApp delivery history for bills and other tenant communications.';

comment on column kiraya.whatsapp_messages.document_id is
    'Optional generated bill image/document sent through WhatsApp.';

comment on column kiraya.whatsapp_messages.provider_message_id is
    'Message identifier returned by the WhatsApp provider.';

comment on column kiraya.whatsapp_messages.retry_count is
    'Number of delivery attempts made.';