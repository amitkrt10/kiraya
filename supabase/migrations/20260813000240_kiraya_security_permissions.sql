-- ============================================================
-- KIRAYA
-- P2 repair: security permissions
-- ============================================================

insert into kiraya.permissions (
    code, name, description, resource, action, is_system
)
values
(
    'organization.write',
    'Organization Write',
    'Allows write access to organization-managed data.',
    'organization',
    'write',
    true
),
(
    'imports.execute',
    'Execute Imports',
    'Allows CSV imports into the organization.',
    'imports',
    'execute',
    true
)
on conflict (code)
do update set
    name = excluded.name,
    description = excluded.description,
    resource = excluded.resource,
    action = excluded.action,
    is_system = true;
