-- ============================================================
-- KIRAYA
-- Migration: updated_at triggers
--
-- Purpose:
-- Applies the common set_updated_at() trigger to all mutable
-- Kiraya tables that contain an updated_at column.
-- ============================================================

do $$
declare
    table_name text;
begin
    foreach table_name in array array[
        'profiles',
        'organizations',
        'roles',
        'organization_members',
        'organization_member_roles',
        'property_types',
        'properties',
        'unit_types',
        'units',
        'owners',
        'property_ownerships',
        'tenants',
        'tenant_user_links',
        'leases',
        'lease_parties',
        'lease_rent_rules',
        'lease_billing_configs',
        'utilities',
        'utility_configurations',
        'utility_rates',
        'meters',
        'meter_reading_batches',
        'meter_readings',
        'billing_runs',
        'bills',
        'bill_items',
        'bill_adjustments',
        'payment_methods',
        'payments',
        'security_deposits',
        'tenant_exits',
        'exit_settlements',
        'documents',
        'whatsapp_messages',
        'imports',
        'deposit_refunds'
    ]
    loop
        execute format(
            'drop trigger if exists trg_%I_updated_at on kiraya.%I',
            table_name,
            table_name
        );

        execute format(
            'create trigger trg_%I_updated_at
             before update on kiraya.%I
             for each row
             execute function kiraya.set_updated_at()',
            table_name,
            table_name
        );
    end loop;
end;
$$;