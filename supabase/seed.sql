-- ============================================================
-- KIRAYA — P5.16 local-only disposable E2E seed
--
-- Runs automatically on `supabase db reset` / `supabase start` against the
-- LOCAL Docker Postgres only (wired via supabase/config.toml's
-- [db.seed] sql_paths). It never runs against, and cannot reach, the
-- linked hosted project.
--
-- Provisions two deterministic local test organizations end-to-end
-- (Auth users -> profiles -> organizations -> memberships -> roles ->
-- properties/units/tenants/leases), then builds the specific financial
-- prerequisite states the previously-mutation-blocked E2E tests need,
-- using the real kiraya.* RPCs wherever one exists (generate_bill,
-- finalize_bill) rather than hand-crafting bill/ledger rows -- per P5.16's
-- own principle, this guarantees the seed data is exactly as internally
-- consistent as data produced by real usage.
--
-- Runs as the "postgres" role (table owner), which Postgres RLS does not
-- apply to by default -- confirmed no table in this schema uses FORCE ROW
-- LEVEL SECURITY, so these are plain, unrestricted inserts. The financial
-- RPCs called here (generate_bill, finalize_bill) were confirmed to have
-- no internal auth.uid()-dependent authorization check, so no simulated
-- session is required to call them from this script.
--
-- Local-only test credentials (never reused from the hosted E2E fixtures,
-- namespaced with a @local.e2e.test domain so they can never collide with
-- or be mistaken for real/hosted accounts):
--   org-a-admin@local.e2e.test   / local-e2e-p5-16     (Org A, ORG_ADMIN)
--   org-a-viewer@local.e2e.test  / local-e2e-p5-16     (Org A, no role -> read-only)
--   org-b-admin@local.e2e.test   / local-e2e-p5-16     (Org B, ORG_ADMIN)
-- ============================================================

-- On the hosted project, PostgREST access to the "kiraya" schema and its
-- tables works because Supabase's platform provisioning automatically
-- grants USAGE/ALL on every schema PostgREST exposes -- this is the exact
-- "grant exists live but not in any migration" pattern this project has
-- already confirmed several times (P5.9/P5.10, individual function
-- grants). A bare local `supabase start` only does this automatically for
-- its own built-in schemas, never for a custom one like "kiraya" --
-- confirmed directly: without this block, an authenticated local session
-- gets "permission denied for schema kiraya" from PostgREST even though
-- RLS and the row data are otherwise entirely correct. This is
-- local-environment bootstrapping only, not a schema change, so it lives
-- here rather than in a migration (which the hosted project already
-- doesn't need).
grant usage on schema kiraya to anon, authenticated, service_role;
grant all on all tables in schema kiraya to anon, authenticated, service_role;
grant all on all sequences in schema kiraya to anon, authenticated, service_role;
grant all on all functions in schema kiraya to anon, authenticated, service_role;

do $$
declare
    -- Orgs
    v_org_a_id uuid := 'a0000000-0000-4000-a000-000000000001';
    v_org_b_id uuid := 'b0000000-0000-4000-b000-000000000001';

    -- Auth/profile/membership
    v_admin_a_id uuid := 'a0000000-0000-4000-a000-0000000000a1';
    v_viewer_a_id uuid := 'a0000000-0000-4000-a000-0000000000a2';
    v_admin_b_id uuid := 'b0000000-0000-4000-b000-0000000000b1';
    v_member_admin_a_id uuid;
    v_member_viewer_a_id uuid;
    v_member_admin_b_id uuid;
    v_role_admin_a_id uuid;
    v_role_admin_b_id uuid;
    v_instance_id uuid := '00000000-0000-0000-0000-000000000000';
    v_password_hash text := crypt('local-e2e-p5-16', gen_salt('bf'));

    -- Properties / units / payment methods
    v_property_a_id uuid := 'a0000000-0000-4000-a000-0000000000f1';
    v_property_b_id uuid := 'b0000000-0000-4000-b000-0000000000f1';
    v_payment_method_a_id uuid;
    v_payment_method_b_id uuid;
    v_unit_iso_id uuid;
    v_unit_credit_id uuid;
    v_unit_exit_id uuid;
    v_unit_dep_existing_id uuid;
    v_unit_dep_zero_id uuid;
    v_unit_util_id uuid;
    -- Deterministic: scripts/e2e-local.sh references it directly as
    -- E2E_ORG_A_SHARED_UNIT_ID.
    v_unit_shared_id uuid := 'a0000000-0000-4000-a000-00000000005f';
    v_unit_b_id uuid;

    -- Tenants / leases (Org A). The isolation and exit-wizard fixtures use
    -- deterministic literals (not gen_random_uuid()) because scripts/
    -- e2e-local.sh references them directly as E2E_ORG_A_DEPOSIT_TENANT_ID /
    -- E2E_ORG_A_EXIT_TENANT_ID / E2E_ORG_A_EXIT_LEASE_ID.
    v_tenant_iso_id uuid := 'a0000000-0000-4000-a000-0000000000e1';
    v_lease_iso_id uuid;
    v_tenant_credit_id uuid;
    v_lease_credit_id uuid;
    v_tenant_exit_id uuid := 'a0000000-0000-4000-a000-0000000000e3';
    v_lease_exit_id uuid := 'a0000000-0000-4000-a000-00000000003a';
    v_tenant_dep_existing_id uuid;
    v_lease_dep_existing_id uuid;
    v_tenant_dep_zero_id uuid;
    v_lease_dep_zero_id uuid;
    v_tenant_util_id uuid;
    v_lease_util_id uuid;

    -- Shared-unit exit fixture: one unit, two leases. The first is exited
    -- through the full wizard; the second (DRAFT, dates starting strictly
    -- after the first lease's own agreement_end_date so the overlap-
    -- validation trigger permits both) is what should keep the unit from
    -- being marked VACANT once the first lease's exit completes --
    -- confirmed directly from kiraya.complete_tenant_exit()'s own body:
    -- it only frees the unit if no OTHER lease with status ACTIVE/DRAFT
    -- still references it, a pure status check independent of dates.
    v_tenant_shared_exit_id uuid;
    v_lease_shared_exit_id uuid := 'a0000000-0000-4000-a000-00000000006f';
    v_tenant_shared_incoming_id uuid;
    v_lease_shared_incoming_id uuid;
    v_shared_exit_agreement_end date;

    -- Tenant / lease (Org B)
    v_tenant_b_id uuid;
    v_lease_b_id uuid;

    -- Financial fixture working variables
    v_period_start date := date_trunc('month', current_date - interval '1 month')::date;
    v_period_end date := (date_trunc('month', current_date)::date - 1);
    v_occupancy_start date := current_date - interval '6 months';
    v_credit_bill_id uuid;
    v_util_bill_id uuid;
    v_dep_existing_id uuid;
    v_dep_zero_id uuid;
    v_utility_id uuid;
    v_utility_config_id uuid;
    -- Deterministic: scripts/e2e-local.sh references it directly as
    -- E2E_ORG_A_METER_WITH_BILL_ID.
    v_meter_id uuid := 'a0000000-0000-4000-a000-00000000005e';
begin

    -- ============================================================
    -- Organizations
    -- ============================================================

    insert into kiraya.organizations (id, organization_code, name, status, currency_code)
    values
        (v_org_a_id, 'LOCAL-E2E-ORG-A', 'Kiraya Local E2E Organization A', 'ACTIVE', 'INR'),
        (v_org_b_id, 'LOCAL-E2E-ORG-B', 'Kiraya Local E2E Organization B', 'ACTIVE', 'INR');

    -- ============================================================
    -- Auth users + identities (P5.15's confirmed-feasible approach:
    -- direct insert, not the Admin API, with email_confirmed_at already
    -- set so each account is immediately usable via signInWithPassword()).
    -- ============================================================

    insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
    )
    values
        (v_instance_id, v_admin_a_id, 'authenticated', 'authenticated', 'org-a-admin@local.e2e.test', v_password_hash, now(),
         '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''),
        (v_instance_id, v_viewer_a_id, 'authenticated', 'authenticated', 'org-a-viewer@local.e2e.test', v_password_hash, now(),
         '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''),
        (v_instance_id, v_admin_b_id, 'authenticated', 'authenticated', 'org-b-admin@local.e2e.test', v_password_hash, now(),
         '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    values
        (gen_random_uuid(), v_admin_a_id, v_admin_a_id::text,
         jsonb_build_object('sub', v_admin_a_id::text, 'email', 'org-a-admin@local.e2e.test'), 'email', now(), now()),
        (gen_random_uuid(), v_viewer_a_id, v_viewer_a_id::text,
         jsonb_build_object('sub', v_viewer_a_id::text, 'email', 'org-a-viewer@local.e2e.test'), 'email', now(), now()),
        (gen_random_uuid(), v_admin_b_id, v_admin_b_id::text,
         jsonb_build_object('sub', v_admin_b_id::text, 'email', 'org-b-admin@local.e2e.test'), 'email', now(), now());

    -- ============================================================
    -- Kiraya profiles (1:1 with auth.users) -- P5.7L's "signed in but no
    -- active Kiraya profile" trap is avoided by creating these in the same
    -- script, before anything tries to sign in.
    -- ============================================================

    insert into kiraya.profiles (id, full_name, status)
    values
        (v_admin_a_id, 'E2E Local Admin A', 'ACTIVE'),
        (v_viewer_a_id, 'E2E Local Viewer A', 'ACTIVE'),
        (v_admin_b_id, 'E2E Local Admin B', 'ACTIVE');

    -- ============================================================
    -- Organization roles. is_organization_admin() checks role code IN
    -- ('CLIENT_ADMIN','ORG_ADMIN') directly -- no role_permissions grant is
    -- needed for an ORG_ADMIN to pass can_write_organization(). The viewer
    -- gets an ACTIVE membership below with NO role assigned at all:
    -- is_organization_member() (read access) only requires active
    -- membership, so this alone makes them correctly read-only.
    -- ============================================================

    insert into kiraya.roles (id, organization_id, code, name, scope, is_system)
    values
        (gen_random_uuid(), v_org_a_id, 'ORG_ADMIN', 'Organization Admin', 'ORGANIZATION', false),
        (gen_random_uuid(), v_org_b_id, 'ORG_ADMIN', 'Organization Admin', 'ORGANIZATION', false);

    select id into v_role_admin_a_id from kiraya.roles where organization_id = v_org_a_id and code = 'ORG_ADMIN';
    select id into v_role_admin_b_id from kiraya.roles where organization_id = v_org_b_id and code = 'ORG_ADMIN';

    -- ============================================================
    -- Organization memberships
    -- ============================================================

    insert into kiraya.organization_members (id, organization_id, profile_id, status, joined_at)
    values (gen_random_uuid(), v_org_a_id, v_admin_a_id, 'ACTIVE', now())
    returning id into v_member_admin_a_id;

    insert into kiraya.organization_members (id, organization_id, profile_id, status, joined_at)
    values (gen_random_uuid(), v_org_a_id, v_viewer_a_id, 'ACTIVE', now())
    returning id into v_member_viewer_a_id;

    insert into kiraya.organization_members (id, organization_id, profile_id, status, joined_at)
    values (gen_random_uuid(), v_org_b_id, v_admin_b_id, 'ACTIVE', now())
    returning id into v_member_admin_b_id;

    insert into kiraya.organization_member_roles (organization_member_id, role_id)
    values
        (v_member_admin_a_id, v_role_admin_a_id),
        (v_member_admin_b_id, v_role_admin_b_id);
    -- (v_member_viewer_a_id intentionally gets no role row.)

    -- ============================================================
    -- Payment methods (required not-null FK on payments)
    -- ============================================================

    insert into kiraya.payment_methods (id, organization_id, code, name, method_type, is_active)
    values (gen_random_uuid(), v_org_a_id, 'CASH', 'Cash', 'CASH', true)
    returning id into v_payment_method_a_id;

    insert into kiraya.payment_methods (id, organization_id, code, name, method_type, is_active)
    values (gen_random_uuid(), v_org_b_id, 'CASH', 'Cash', 'CASH', true)
    returning id into v_payment_method_b_id;

    -- ============================================================
    -- Properties
    -- ============================================================

    insert into kiraya.properties (id, organization_id, property_code, name, status)
    values (v_property_a_id, v_org_a_id, 'LOCAL-E2E-PROP-A', 'Local E2E Property A', 'ACTIVE');

    insert into kiraya.properties (id, organization_id, property_code, name, status)
    values (v_property_b_id, v_org_b_id, 'LOCAL-E2E-PROP-B', 'Local E2E Property B', 'ACTIVE');

    -- ============================================================
    -- Units -- one per Org A test scenario (kept dedicated per Step 6/8's
    -- "each mutation test its own target tenant/lease" rule) plus one for
    -- Org B.
    -- ============================================================

    insert into kiraya.units (id, organization_id, property_id, unit_code, status)
    values
        (gen_random_uuid(), v_org_a_id, v_property_a_id, 'ISO', 'OCCUPIED') returning id into v_unit_iso_id;
    insert into kiraya.units (id, organization_id, property_id, unit_code, status)
    values (gen_random_uuid(), v_org_a_id, v_property_a_id, 'CREDIT', 'OCCUPIED') returning id into v_unit_credit_id;
    insert into kiraya.units (id, organization_id, property_id, unit_code, status)
    values (gen_random_uuid(), v_org_a_id, v_property_a_id, 'EXIT', 'OCCUPIED') returning id into v_unit_exit_id;
    insert into kiraya.units (id, organization_id, property_id, unit_code, status)
    values (gen_random_uuid(), v_org_a_id, v_property_a_id, 'DEP-EXISTING', 'OCCUPIED') returning id into v_unit_dep_existing_id;
    insert into kiraya.units (id, organization_id, property_id, unit_code, status)
    values (gen_random_uuid(), v_org_a_id, v_property_a_id, 'DEP-ZERO', 'OCCUPIED') returning id into v_unit_dep_zero_id;
    insert into kiraya.units (id, organization_id, property_id, unit_code, status)
    values (gen_random_uuid(), v_org_a_id, v_property_a_id, 'UTIL', 'OCCUPIED') returning id into v_unit_util_id;
    insert into kiraya.units (id, organization_id, property_id, unit_code, status)
    values (v_unit_shared_id, v_org_a_id, v_property_a_id, 'SHARED', 'OCCUPIED');

    insert into kiraya.units (id, organization_id, property_id, unit_code, status)
    values (gen_random_uuid(), v_org_b_id, v_property_b_id, 'B-UNIT', 'OCCUPIED') returning id into v_unit_b_id;

    -- ============================================================
    -- Tenants
    -- ============================================================

    insert into kiraya.tenants (id, organization_id, tenant_code, display_name, status)
    values (v_tenant_iso_id, v_org_a_id, 'LOCAL-TEN-ISO', 'Local E2E Tenant — Isolation', 'ACTIVE');
    insert into kiraya.tenants (id, organization_id, tenant_code, display_name, status)
    values (gen_random_uuid(), v_org_a_id, 'LOCAL-TEN-CREDIT', 'Local E2E Tenant — Apply Credit', 'ACTIVE') returning id into v_tenant_credit_id;
    insert into kiraya.tenants (id, organization_id, tenant_code, display_name, status)
    values (v_tenant_exit_id, v_org_a_id, 'LOCAL-TEN-EXIT', 'Local E2E Tenant — Exit Wizard', 'ACTIVE');
    insert into kiraya.tenants (id, organization_id, tenant_code, display_name, status)
    values (gen_random_uuid(), v_org_a_id, 'LOCAL-TEN-DEP-EXISTING', 'Local E2E Tenant — Existing Deposit', 'ACTIVE') returning id into v_tenant_dep_existing_id;
    insert into kiraya.tenants (id, organization_id, tenant_code, display_name, status)
    values (gen_random_uuid(), v_org_a_id, 'LOCAL-TEN-DEP-ZERO', 'Local E2E Tenant — Zero Held Deposit', 'ACTIVE') returning id into v_tenant_dep_zero_id;
    insert into kiraya.tenants (id, organization_id, tenant_code, display_name, status)
    values (gen_random_uuid(), v_org_a_id, 'LOCAL-TEN-UTIL', 'Local E2E Tenant — Utilities', 'ACTIVE') returning id into v_tenant_util_id;
    insert into kiraya.tenants (id, organization_id, tenant_code, display_name, status)
    values (gen_random_uuid(), v_org_a_id, 'LOCAL-TEN-SHARED-EXIT', 'Local E2E Tenant — Shared Unit Exit', 'ACTIVE') returning id into v_tenant_shared_exit_id;
    insert into kiraya.tenants (id, organization_id, tenant_code, display_name, status)
    values (gen_random_uuid(), v_org_a_id, 'LOCAL-TEN-SHARED-INCOMING', 'Local E2E Tenant — Shared Unit Incoming', 'ACTIVE') returning id into v_tenant_shared_incoming_id;

    insert into kiraya.tenants (id, organization_id, tenant_code, display_name, status)
    values (gen_random_uuid(), v_org_b_id, 'LOCAL-TEN-B', 'Local E2E Tenant B', 'ACTIVE') returning id into v_tenant_b_id;

    -- ============================================================
    -- Leases (+ rent rule + billing config for every lease, so any of
    -- them could have a bill generated against it if a future checkpoint
    -- needs to)
    -- ============================================================

    insert into kiraya.leases (id, organization_id, tenant_id, unit_id, lease_code, status, agreement_start_date, occupancy_start_date, currency_code)
    values (gen_random_uuid(), v_org_a_id, v_tenant_iso_id, v_unit_iso_id, 'LOCAL-LEASE-ISO', 'ACTIVE', v_occupancy_start, v_occupancy_start, 'INR')
    returning id into v_lease_iso_id;
    insert into kiraya.leases (id, organization_id, tenant_id, unit_id, lease_code, status, agreement_start_date, occupancy_start_date, currency_code)
    values (gen_random_uuid(), v_org_a_id, v_tenant_credit_id, v_unit_credit_id, 'LOCAL-LEASE-CREDIT', 'ACTIVE', v_occupancy_start, v_occupancy_start, 'INR')
    returning id into v_lease_credit_id;
    insert into kiraya.leases (id, organization_id, tenant_id, unit_id, lease_code, status, agreement_start_date, occupancy_start_date, currency_code)
    values (v_lease_exit_id, v_org_a_id, v_tenant_exit_id, v_unit_exit_id, 'LOCAL-LEASE-EXIT', 'ACTIVE', v_occupancy_start, v_occupancy_start, 'INR');
    insert into kiraya.leases (id, organization_id, tenant_id, unit_id, lease_code, status, agreement_start_date, occupancy_start_date, currency_code)
    values (gen_random_uuid(), v_org_a_id, v_tenant_dep_existing_id, v_unit_dep_existing_id, 'LOCAL-LEASE-DEP-EXISTING', 'ACTIVE', v_occupancy_start, v_occupancy_start, 'INR')
    returning id into v_lease_dep_existing_id;
    insert into kiraya.leases (id, organization_id, tenant_id, unit_id, lease_code, status, agreement_start_date, occupancy_start_date, currency_code)
    values (gen_random_uuid(), v_org_a_id, v_tenant_dep_zero_id, v_unit_dep_zero_id, 'LOCAL-LEASE-DEP-ZERO', 'ACTIVE', v_occupancy_start, v_occupancy_start, 'INR')
    returning id into v_lease_dep_zero_id;
    insert into kiraya.leases (id, organization_id, tenant_id, unit_id, lease_code, status, agreement_start_date, occupancy_start_date, currency_code)
    values (gen_random_uuid(), v_org_a_id, v_tenant_util_id, v_unit_util_id, 'LOCAL-LEASE-UTIL', 'ACTIVE', v_occupancy_start, v_occupancy_start, 'INR')
    returning id into v_lease_util_id;

    -- Shared-unit pair: the exited lease needs a finite agreement_end_date
    -- (an open-ended lease's overlap range has no upper bound at all, per
    -- validate_lease_overlap()'s own "open-ended treated as extending
    -- indefinitely" comment, which would make ANY second lease on the same
    -- unit collide with it regardless of dates) so the incoming DRAFT
    -- lease's occupancy can start strictly after it without the overlap
    -- trigger rejecting the insert.
    v_shared_exit_agreement_end := v_occupancy_start + interval '5 months';

    insert into kiraya.leases (id, organization_id, tenant_id, unit_id, lease_code, status, agreement_start_date, occupancy_start_date, agreement_end_date, currency_code)
    values (v_lease_shared_exit_id, v_org_a_id, v_tenant_shared_exit_id, v_unit_shared_id, 'LOCAL-LEASE-SHARED-EXIT', 'ACTIVE', v_occupancy_start, v_occupancy_start, v_shared_exit_agreement_end, 'INR');

    insert into kiraya.leases (id, organization_id, tenant_id, unit_id, lease_code, status, agreement_start_date, occupancy_start_date, currency_code)
    values (gen_random_uuid(), v_org_a_id, v_tenant_shared_incoming_id, v_unit_shared_id, 'LOCAL-LEASE-SHARED-INCOMING', 'DRAFT', v_shared_exit_agreement_end + 1, v_shared_exit_agreement_end + 1, 'INR')
    returning id into v_lease_shared_incoming_id;

    insert into kiraya.leases (id, organization_id, tenant_id, unit_id, lease_code, status, agreement_start_date, occupancy_start_date, currency_code)
    values (gen_random_uuid(), v_org_b_id, v_tenant_b_id, v_unit_b_id, 'LOCAL-LEASE-B', 'ACTIVE', v_occupancy_start, v_occupancy_start, 'INR')
    returning id into v_lease_b_id;

    insert into kiraya.lease_rent_rules (organization_id, lease_id, rule_name, monthly_rent, effective_from)
    select v_org_a_id, id, 'Base rent', 10000, v_occupancy_start
    from kiraya.leases where id in (v_lease_iso_id, v_lease_credit_id, v_lease_exit_id, v_lease_dep_existing_id, v_lease_dep_zero_id, v_lease_util_id, v_lease_shared_exit_id, v_lease_shared_incoming_id);

    insert into kiraya.lease_rent_rules (organization_id, lease_id, rule_name, monthly_rent, effective_from)
    values (v_org_b_id, v_lease_b_id, 'Base rent', 10000, v_occupancy_start);

    insert into kiraya.lease_billing_configs (organization_id, lease_id, billing_frequency, billing_day, proration_method, effective_from)
    select v_org_a_id, id, 'MONTHLY', 1, 'CALENDAR_DAYS', v_occupancy_start
    from kiraya.leases where id in (v_lease_iso_id, v_lease_credit_id, v_lease_exit_id, v_lease_dep_existing_id, v_lease_dep_zero_id, v_lease_util_id, v_lease_shared_exit_id, v_lease_shared_incoming_id);

    insert into kiraya.lease_billing_configs (organization_id, lease_id, billing_frequency, billing_day, proration_method, effective_from)
    values (v_org_b_id, v_lease_b_id, 'MONTHLY', 1, 'CALENDAR_DAYS', v_occupancy_start);

    -- A payment for org B's tenant so payments-isolation.spec.ts's org-B
    -- "own list renders, isolation holds" tests have something to inspect.
    insert into kiraya.payments (organization_id, tenant_id, payment_method_id, payment_number, payment_date, amount, status, received_by)
    values (v_org_b_id, v_tenant_b_id, v_payment_method_b_id, 'LOCAL-PAY-B-001', current_date, 10000, 'POSTED', v_admin_b_id);

    -- ============================================================
    -- Apply-credit fixture (P5.16 Step 7: build prerequisites via the real
    -- workflow, let the E2E test itself perform the mutation).
    --
    -- Order matters here: kiraya.payments has an AFTER INSERT/UPDATE
    -- trigger (trg_process_posted_payment -> process_posted_payment())
    -- that automatically calls BOTH post_payment_to_ledger() AND
    -- allocate_payment_to_bills() the moment a payment is inserted with
    -- status='POSTED' -- confirmed directly while validating this script,
    -- after an initial attempt that inserted the payment *after* the bill
    -- got the payment silently auto-allocated to it, leaving the bill
    -- PARTIALLY_PAID instead of available as credit. Posting the payment
    -- FIRST, while the tenant has no bill at all yet, means
    -- allocate_payment_to_bills() has nothing to allocate it to, so it
    -- remains fully unapplied -- exactly what kiraya.get_tenant_credit()
    -- counts as available credit. The bill generated afterwards correctly
    -- has no previous-due line either, since generate_bill() calls
    -- get_tenant_due() (which nets against the same credit) at creation
    -- time.
    insert into kiraya.payments (organization_id, tenant_id, payment_method_id, payment_number, payment_date, amount, status, received_by)
    values (v_org_a_id, v_tenant_credit_id, v_payment_method_a_id, 'LOCAL-PAY-CREDIT-001', current_date, 5000, 'POSTED', v_admin_a_id);

    v_credit_bill_id := kiraya.generate_bill(v_lease_credit_id, v_period_start, v_period_end, current_date, current_date + 7);
    perform kiraya.finalize_bill(v_credit_bill_id, v_admin_a_id);

    -- ============================================================
    -- Security deposit fixtures.
    -- v_tenant_dep_zero_id and v_tenant_dep_existing_id get real
    -- security_deposits rows below (their DB summary columns are
    -- maintained by kiraya.sync_security_deposit_summary(), triggered by
    -- the security_deposit_transactions insert -- not hand-computed here).
    -- v_tenant_iso_id (reused for security-deposit.spec.ts's own dynamic
    -- lookup) deliberately gets none: that test needs a tenant with NO
    -- deposit yet, then creates one itself through the real UI.
    -- ============================================================

    -- The exit-wizard tenant also gets a received deposit: the real exit
    -- settlement workflow (Step 7's own principle -- seed the prerequisite,
    -- let the E2E test drive the actual exit through the UI) nets deposit
    -- held amount against dues, so a lease with no deposit at all would
    -- exercise a degenerate case rather than the real settlement path.
    insert into kiraya.security_deposits (id, organization_id, lease_id, tenant_id, deposit_reference, required_amount, status)
    values (gen_random_uuid(), v_org_a_id, v_lease_exit_id, v_tenant_exit_id, 'LOCAL-DEP-EXIT-001', 30000, 'PENDING')
    returning id into v_dep_existing_id;

    insert into kiraya.security_deposit_transactions (organization_id, security_deposit_id, tenant_id, lease_id, transaction_type, description, transaction_date, amount, created_by)
    values (v_org_a_id, v_dep_existing_id, v_tenant_exit_id, v_lease_exit_id, 'RECEIPT', 'Local E2E seed: deposit receipt', current_date, 30000, v_admin_a_id);

    -- Same reasoning for the shared-unit exit fixture's tenant.
    insert into kiraya.security_deposits (id, organization_id, lease_id, tenant_id, deposit_reference, required_amount, status)
    values (gen_random_uuid(), v_org_a_id, v_lease_shared_exit_id, v_tenant_shared_exit_id, 'LOCAL-DEP-SHARED-EXIT-001', 30000, 'PENDING')
    returning id into v_dep_existing_id;

    insert into kiraya.security_deposit_transactions (organization_id, security_deposit_id, tenant_id, lease_id, transaction_type, description, transaction_date, amount, created_by)
    values (v_org_a_id, v_dep_existing_id, v_tenant_shared_exit_id, v_lease_shared_exit_id, 'RECEIPT', 'Local E2E seed: deposit receipt', current_date, 30000, v_admin_a_id);

    insert into kiraya.security_deposits (id, organization_id, lease_id, tenant_id, deposit_reference, required_amount, status)
    values (gen_random_uuid(), v_org_a_id, v_lease_dep_existing_id, v_tenant_dep_existing_id, 'LOCAL-DEP-EXISTING-001', 50000, 'PENDING')
    returning id into v_dep_existing_id;

    insert into kiraya.security_deposit_transactions (organization_id, security_deposit_id, tenant_id, lease_id, transaction_type, description, transaction_date, amount, created_by)
    values (v_org_a_id, v_dep_existing_id, v_tenant_dep_existing_id, v_lease_dep_existing_id, 'RECEIPT', 'Local E2E seed: deposit receipt', current_date, 50000, v_admin_a_id);

    insert into kiraya.security_deposits (id, organization_id, lease_id, tenant_id, deposit_reference, required_amount, status)
    values (gen_random_uuid(), v_org_a_id, v_lease_dep_zero_id, v_tenant_dep_zero_id, 'LOCAL-DEP-ZERO-001', 50000, 'PENDING')
    returning id into v_dep_zero_id;

    insert into kiraya.security_deposit_transactions (organization_id, security_deposit_id, tenant_id, lease_id, transaction_type, description, transaction_date, amount, created_by)
    values (v_org_a_id, v_dep_zero_id, v_tenant_dep_zero_id, v_lease_dep_zero_id, 'RECEIPT', 'Local E2E seed: deposit receipt', current_date - 60, 50000, v_admin_a_id);

    -- Held = received - deducted - refunded. A direct REFUND-type
    -- transaction insert is blocked by a guard ("must be processed through
    -- the deposit refund workflow", confirmed directly) -- reaching
    -- Held = 0 via a single full DEDUCTION avoids that entirely and needs
    -- no separate refund-workflow fixture.
    insert into kiraya.security_deposit_transactions (organization_id, security_deposit_id, tenant_id, lease_id, transaction_type, description, transaction_date, amount, created_by)
    values (v_org_a_id, v_dep_zero_id, v_tenant_dep_zero_id, v_lease_dep_zero_id, 'DEDUCTION', 'Local E2E seed: deposit deduction', current_date - 30, 50000, v_admin_a_id);

    -- ============================================================
    -- Utilities/meters fixture: a metered utility configured on the util
    -- unit, two readings spanning the bill period (so consumption can be
    -- computed), then a bill generated (which internally calls
    -- kiraya.generate_utility_bill_items() itself) and finalized -- giving
    -- utilities-meters.spec.ts a real, finalized UTILITY bill_item to
    -- inspect, exactly as the real billing path would produce it.
    -- ============================================================

    insert into kiraya.utilities (id, organization_id, code, name, unit_name, is_metered, is_active)
    values (gen_random_uuid(), v_org_a_id, 'LOCAL-ELEC', 'Electricity', 'kWh', true, true)
    returning id into v_utility_id;

    insert into kiraya.utility_configurations (id, organization_id, utility_id, unit_id, meter_type, is_tenant_chargeable, is_active, effective_from)
    values (gen_random_uuid(), v_org_a_id, v_utility_id, v_unit_util_id, 'SUB_METER', true, true, v_occupancy_start)
    returning id into v_utility_config_id;

    insert into kiraya.meters (id, organization_id, utility_id, unit_id, meter_code, meter_type, unit_name, initial_reading, is_active, installed_on)
    values (v_meter_id, v_org_a_id, v_utility_id, v_unit_util_id, 'LOCAL-METER-001', 'SUB_METER', 'kWh', 0, true, v_occupancy_start);

    insert into kiraya.meter_readings (organization_id, meter_id, reading_date, reading_value, reading_source)
    values (v_org_a_id, v_meter_id, v_period_start - 1, 1000, 'MANUAL');

    insert into kiraya.meter_readings (organization_id, meter_id, reading_date, reading_value, reading_source)
    values (v_org_a_id, v_meter_id, v_period_end, 1150, 'MANUAL');

    -- kiraya.generate_utility_bill_items() looks up an active
    -- utility_rates row for the utility and silently skips charging it
    -- (no bill_item, no error) if none is found -- confirmed directly:
    -- this row was missing on the first pass and produced a rent-only
    -- bill with no UTILITY line at all.
    insert into kiraya.utility_rates (organization_id, utility_id, utility_configuration_id, rate, unit_name, effective_from)
    values (v_org_a_id, v_utility_id, v_utility_config_id, 8.00, 'kWh', v_occupancy_start);

    v_util_bill_id := kiraya.generate_bill(v_lease_util_id, v_period_start, v_period_end, current_date, current_date + 7);
    perform kiraya.finalize_bill(v_util_bill_id, v_admin_a_id);

end $$;
