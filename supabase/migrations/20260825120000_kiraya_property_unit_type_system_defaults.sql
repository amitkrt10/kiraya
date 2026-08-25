-- ============================================================
-- KIRAYA
-- P6.1-A: system default Property Types and Unit Types
--
-- Purpose:
-- kiraya.property_types and kiraya.unit_types (20260813000109,
-- 20260813000111) were created with a hybrid system/organization-scoped
-- design but no migration ever seeded the system rows, so both tables
-- have been empty since launch and the Add Property / Add Unit dropdowns
-- render "No ... configured yet". This migration only inserts the
-- canonical system rows (organization_id NULL, is_system = true) -- it
-- does not touch the table definitions, RLS, or foreign keys.
--
-- Idempotent: uses the same insert ... on conflict do update convention
-- as 20260813000240_kiraya_security_permissions.sql, targeting each
-- table's existing partial unique index on lower(trim(code)) where
-- is_system = true, so replaying this migration updates the seeded rows
-- in place rather than duplicating them.
-- ============================================================

insert into kiraya.property_types (
    code, name, description, is_system, is_active, sort_order
)
values
    ('APARTMENT', 'Apartment', 'A residential unit within a larger building.', true, true, 1),
    ('VILLA', 'Villa', 'A standalone residential property, typically with private outdoor space.', true, true, 2),
    ('HOUSE', 'House', 'A standalone or row residential house.', true, true, 3),
    ('BUILDING', 'Building', 'A multi-unit residential or mixed-use building.', true, true, 4),
    ('COMMERCIAL', 'Commercial', 'A property used for general commercial purposes.', true, true, 5),
    ('OFFICE', 'Office', 'A property used as office space.', true, true, 6),
    ('SHOP', 'Shop', 'A retail storefront property.', true, true, 7),
    ('WAREHOUSE', 'Warehouse', 'A property used for storage or industrial purposes.', true, true, 8),
    ('OTHER', 'Other', 'A property type that does not fit the other categories.', true, true, 9)
on conflict (lower(trim(code))) where (is_system = true)
do update set
    name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into kiraya.unit_types (
    code, name, description, is_system, is_active, sort_order
)
values
    ('STUDIO', 'Studio', 'A single-room unit combining living and sleeping space.', true, true, 1),
    ('1_BHK', '1 BHK', 'A unit with one bedroom, hall, and kitchen.', true, true, 2),
    ('2_BHK', '2 BHK', 'A unit with two bedrooms, hall, and kitchen.', true, true, 3),
    ('3_BHK', '3 BHK', 'A unit with three bedrooms, hall, and kitchen.', true, true, 4),
    ('4_BHK', '4 BHK', 'A unit with four bedrooms, hall, and kitchen.', true, true, 5),
    ('SHOP', 'Shop', 'A retail storefront unit.', true, true, 6),
    ('OFFICE', 'Office', 'A unit used as office space.', true, true, 7),
    ('WAREHOUSE', 'Warehouse', 'A unit used for storage or industrial purposes.', true, true, 8),
    ('OTHER', 'Other', 'A unit type that does not fit the other categories.', true, true, 9)
on conflict (lower(trim(code))) where (is_system = true)
do update set
    name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();
