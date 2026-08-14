-- ============================================================
-- KIRAYA
-- Migration: enable RLS
--
-- Purpose:
-- Enable Row Level Security across all tenant-sensitive
-- Kiraya tables.
--
-- Policies are added in subsequent migrations.
-- ============================================================

alter table kiraya.profiles enable row level security;

alter table kiraya.profile_roles enable row level security;

alter table kiraya.roles enable row level security;

alter table kiraya.permissions enable row level security;

alter table kiraya.role_permissions enable row level security;

alter table kiraya.organizations enable row level security;

alter table kiraya.organization_members enable row level security;

alter table kiraya.organization_member_roles enable row level security;

alter table kiraya.property_types enable row level security;

alter table kiraya.properties enable row level security;

alter table kiraya.unit_types enable row level security;

alter table kiraya.units enable row level security;

alter table kiraya.owners enable row level security;

alter table kiraya.property_ownerships enable row level security;

alter table kiraya.tenants enable row level security;

alter table kiraya.tenant_user_links enable row level security;

alter table kiraya.leases enable row level security;

alter table kiraya.lease_parties enable row level security;

alter table kiraya.lease_rent_rules enable row level security;

alter table kiraya.lease_billing_configs enable row level security;

alter table kiraya.utilities enable row level security;

alter table kiraya.utility_configurations enable row level security;

alter table kiraya.utility_rates enable row level security;

alter table kiraya.meters enable row level security;

alter table kiraya.meter_reading_batches enable row level security;

alter table kiraya.meter_readings enable row level security;

alter table kiraya.billing_runs enable row level security;

alter table kiraya.bills enable row level security;

alter table kiraya.bill_items enable row level security;

alter table kiraya.bill_adjustments enable row level security;

alter table kiraya.payment_methods enable row level security;

alter table kiraya.payments enable row level security;

alter table kiraya.payment_allocations enable row level security;

alter table kiraya.ledger_entries enable row level security;

alter table kiraya.security_deposits enable row level security;

alter table kiraya.security_deposit_transactions enable row level security;

alter table kiraya.tenant_exits enable row level security;

alter table kiraya.exit_settlements enable row level security;

alter table kiraya.exit_settlement_items enable row level security;

alter table kiraya.deposit_refunds enable row level security;

alter table kiraya.documents enable row level security;

alter table kiraya.whatsapp_messages enable row level security;

alter table kiraya.imports enable row level security;

alter table kiraya.import_errors enable row level security;

alter table kiraya.audit_logs enable row level security;