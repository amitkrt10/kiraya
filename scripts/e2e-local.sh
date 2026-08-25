#!/usr/bin/env bash
# P5.16 — run Playwright against the disposable local Supabase environment
# instead of the hosted project used by `npm run test:e2e`.
#
# This never edits .env.local: it exports NEXT_PUBLIC_SUPABASE_URL/
# NEXT_PUBLIC_SUPABASE_ANON_KEY and the local E2E_* credentials as process
# environment variables for this one invocation only. playwright.config.ts's
# loadEnvConfig() only fills in variables that are not already set, so these
# exported values take precedence over whatever .env.local has, and nothing
# written to disk changes.
#
# Prerequisites: `supabase start` must already be running locally (this
# script does not start/stop it, and never touches the linked hosted
# project). Run `supabase db reset` first if you want fresh seeded state.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! supabase status >/dev/null 2>&1; then
  echo "Local Supabase is not running. Start it first:" >&2
  echo "  supabase start" >&2
  echo "  supabase db reset   # optional: fresh seeded state" >&2
  exit 1
fi

eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY)=' | sed 's/^/export /')"

export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"

export E2E_ORG_A_EMAIL="org-a-admin@local.e2e.test"
export E2E_ORG_A_PASSWORD="local-e2e-p5-16"
export E2E_ORG_A_READONLY_EMAIL="org-a-viewer@local.e2e.test"
export E2E_ORG_A_READONLY_PASSWORD="local-e2e-p5-16"
export E2E_ORG_B_EMAIL="org-b-admin@local.e2e.test"
export E2E_ORG_B_PASSWORD="local-e2e-p5-16"

# Deterministic ids seed.sql always assigns to specific fixtures (not
# looked up at runtime, since seed.sql fixes them as literals precisely so
# scripts like this one can reference them directly).
export E2E_ORG_A_PROPERTY_ID="a0000000-0000-4000-a000-0000000000f1"
export E2E_ORG_B_PROPERTY_ID="b0000000-0000-4000-b000-0000000000f1"

# security-deposit.spec.ts's write test needs a tenant with NO deposit yet
# (it creates one itself through the real UI) -- this is seed.sql's
# isolation-fixture tenant, which deliberately never gets a
# security_deposits row.
export E2E_ORG_A_DEPOSIT_TENANT_ID="a0000000-0000-4000-a000-0000000000e1"

# tenant-exit-wizard.spec.ts's mutation tests need a dedicated ACTIVE
# lease/tenant with a received deposit -- seed.sql's exit fixture.
export E2E_ORG_A_EXIT_TENANT_ID="a0000000-0000-4000-a000-0000000000e3"
export E2E_ORG_A_EXIT_LEASE_ID="a0000000-0000-4000-a000-00000000003a"
# tenant-exit-wizard.spec.ts's shared-unit test (P5.17): a unit with two
# leases -- the one being exited, and a DRAFT "incoming" lease that should
# keep the unit from being marked VACANT once the exit completes.
export E2E_ORG_A_SHARED_UNIT_LEASE_ID="a0000000-0000-4000-a000-00000000006f"
export E2E_ORG_A_SHARED_UNIT_ID="a0000000-0000-4000-a000-00000000005f"

# utilities-meters.spec.ts's finalized-bill-item tests -- seed.sql's util
# fixture meter, which already has a real, finalized UTILITY bill item.
export E2E_ORG_A_METER_WITH_BILL_ID="a0000000-0000-4000-a000-00000000005e"

exec npx playwright test "$@"
