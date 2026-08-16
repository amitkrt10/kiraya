-- ============================================================
-- KIRAYA
-- P2.15: security policy cleanup
--
-- The old IMPORT policies were replaced in migrations 241/242.
--
-- This migration intentionally does not drop/recreate every
-- existing policy because the individual resource migrations
-- already define the correct organization boundaries.
--
-- This file documents the security contract.
-- ============================================================


comment on schema kiraya is
    'Kiraya application schema. All tenant/client data is protected by organization- and tenant-scoped RLS.';


comment on function kiraya.can_access_tenant(uuid, uuid) is
    'Tenant access requires both matching organization ownership and either organization membership or active tenant-user linkage.';


comment on function kiraya.can_write_organization(uuid) is
    'Organization write access is restricted to SUPER_ADMIN, CLIENT_ADMIN/ORG_ADMIN, or the explicit organization.write permission.';


comment on function kiraya.can_import_organization(uuid) is
    'CSV import access is restricted to SUPER_ADMIN, organization administrators, or imports.execute permission.';