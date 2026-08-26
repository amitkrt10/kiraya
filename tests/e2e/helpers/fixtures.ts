import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * P5.14 — read-only dynamic fixture lookup for E2E specs.
 *
 * Several isolation/read-only specs previously required a hardcoded
 * `E2E_ORG_A_*_ID` env var pointing at *some specific* pre-existing row
 * (any billing run, bill, payment, tenant, lease, or tenant with a given
 * related record) even though the tests themselves never assert anything
 * about that row's exact identity or value — only that the authenticated
 * org can read it and a different org cannot.
 *
 * These helpers replace that hardcoding with a live, read-only lookup that
 * runs AFTER the test's own real UI login (login(page, email, password)),
 * reusing that same already-authenticated session instead of signing in a
 * second time: `@supabase/ssr` (this app's browser client) stores the
 * session in a `sb-<project-ref>-auth-token` cookie as
 * `base64-<base64 JSON {access_token, refresh_token, ...}>`. This helper
 * reads that cookie via Playwright's own cookie jar and adopts it into a
 * fresh Node-side supabase-js client with `auth.setSession()`, then queries
 * with it. Because the lookup runs as the same real Org A/B member the
 * test is already signed in as, Row Level Security is the only thing
 * scoping every query to that org's own data -- there is no explicit
 * organization_id filter to get wrong, and no way for this helper to reach
 * another organization's rows even if it tried.
 *
 * An earlier version of this file called `signInWithPassword()` directly,
 * once per lookup. Under this project's `fullyParallel: true` config, with
 * several tests (and workers) doing that concurrently against the same two
 * shared E2E accounts on top of each test's own UI sign-in, that measurably
 * increased sign-in volume enough to trip Supabase Auth's own rate limiter
 * ("Request rate limit reached"), observed directly while validating this
 * change. Adopting the existing session via `setSession()` needs no
 * additional password-grant sign-in call at all, which removes the extra
 * load rather than working around it.
 *
 * Every function returns `string | null`. A `null` return means no
 * suitable row currently exists for that fixture type; callers must
 * `test.skip()` rather than fail, exactly like the existing runtime
 * `test.skip()` pattern already used in tenant-exits-list.spec.ts.
 *
 * This file performs no writes. It never creates, updates, or deletes any
 * row, and never touches org B or any org other than the one the page is
 * currently signed in as.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function cookieNameForProject(): string | null {
  if (!SUPABASE_URL) return null;
  const host = new URL(SUPABASE_URL).hostname;
  const projectRef = host.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

async function sessionFromPage(page: Page): Promise<{ access_token: string; refresh_token: string } | null> {
  const cookieName = cookieNameForProject();
  if (!cookieName) return null;

  const cookies = await page.context().cookies();
  const authCookie = cookies.find((c) => c.name === cookieName);
  if (!authCookie) return null;

  const raw = authCookie.value.startsWith("base64-") ? authCookie.value.slice("base64-".length) : authCookie.value;
  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    if (typeof decoded.access_token === "string" && typeof decoded.refresh_token === "string") {
      return { access_token: decoded.access_token, refresh_token: decoded.refresh_token };
    }
  } catch {
    // Falls through to the null return below -- an undecodable cookie is
    // treated as "no session available", not silently ignored: the caller
    // still gets a clean null and skips, it just means this specific
    // extraction failed rather than that no fixture exists in the data.
  }
  return null;
}

type OrgClient = ReturnType<typeof createClient>;

/**
 * Runs `fn` with a client authenticated as whoever `page` is currently
 * signed in as (via the cookie the app's own login already set), then
 * signs the lookup client out locally (this does not touch `page`'s own
 * session; `scope: "local"` only clears this ephemeral client's state).
 */
export async function withPageSession<T>(page: Page, fn: (client: OrgClient) => Promise<T>): Promise<T | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  const session = await sessionFromPage(page);
  if (!session) {
    return null;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: "kiraya" },
    auth: { persistSession: false },
  });

  const { error: setSessionError } = await client.auth.setSession(session);
  if (setSessionError) {
    // The page IS signed in (we found and decoded its cookie) but adopting
    // that session into this lookup client failed -- a real problem, not
    // "no fixture exists". Surface it rather than mask it as a skip.
    throw new Error(`E2E fixture lookup: could not adopt page session: ${setSessionError.message}`);
  }

  // Deliberately no signOut() here: this client holds the exact same
  // access/refresh token as `page`'s own active session (adopted via
  // setSession above, not a separate sign-in). Even client.auth.signOut
  // with `{ scope: "local" }` revokes that token server-side, which would
  // knock `page`'s own session out from under the test that is still using
  // it -- this was reproduced directly while validating this change: every
  // subsequent navigation and the test's own signOut() call started hanging
  // or timing out once the shared token had been revoked out from under it.
  // The client itself is a short-lived local object with `persistSession:
  // false`; letting it be garbage-collected without an explicit sign-out is
  // correct here, not an oversight.
  return await fn(client);
}

/**
 * The display name of the organization `page`'s current session belongs
 * to. RLS scopes kiraya.organizations SELECT to an authenticated member's
 * own organization(s), so this returns exactly the caller's own org name
 * -- never another org's -- with no explicit organization_id filter
 * needed or possible to get wrong.
 */
export async function findCurrentOrganizationName(page: Page): Promise<string | null> {
  return withPageSession(page, async (client) => {
    const { data } = await client.from("organizations").select("name").limit(1).maybeSingle();
    return (data?.name as string | undefined) ?? null;
  });
}

/** Any org's billing run id visible to `page`'s current session (oldest first, most stable). */
export async function findOrgABillingRunId(page: Page): Promise<string | null> {
  return withPageSession(page, async (client) => {
    const { data } = await client
      .from("billing_runs")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return (data?.id as string | undefined) ?? null;
  });
}

/** Any bill id visible to `page`'s current session (oldest first). */
export async function findOrgABillId(page: Page): Promise<string | null> {
  return withPageSession(page, async (client) => {
    const { data } = await client.from("bills").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    return (data?.id as string | undefined) ?? null;
  });
}

/** Any payment id visible to `page`'s current session (oldest first). */
export async function findOrgAPaymentId(page: Page): Promise<string | null> {
  return withPageSession(page, async (client) => {
    const { data } = await client.from("payments").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    return (data?.id as string | undefined) ?? null;
  });
}

/** Any tenant id visible to `page`'s current session (oldest first). */
export async function findOrgATenantId(page: Page): Promise<string | null> {
  return withPageSession(page, async (client) => {
    const { data } = await client.from("tenants").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    return (data?.id as string | undefined) ?? null;
  });
}

/** Any lease id visible to `page`'s current session (oldest first). */
export async function findOrgALeaseId(page: Page): Promise<string | null> {
  return withPageSession(page, async (client) => {
    const { data } = await client.from("leases").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    return (data?.id as string | undefined) ?? null;
  });
}

/** A tenant id that has at least one real ledger entry (oldest matching entry first). */
export async function findOrgATenantIdWithLedgerEntries(page: Page): Promise<string | null> {
  return withPageSession(page, async (client) => {
    const { data } = await client
      .from("ledger_entries")
      .select("tenant_id")
      .not("tenant_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return (data?.tenant_id as string | undefined) ?? null;
  });
}

/**
 * A tenant id that already has a security_deposits row. Ordered newest
 * first to match /app/deposits' own default sort (lib/queries/
 * securityDeposits.ts orders by created_at descending, page size 25) --
 * picking the oldest row instead can select a deposit that exists but sits
 * past the overview's first page, which is a real bug this helper must not
 * reintroduce (the same class of pagination-dependent fixture problem
 * P5.7L already had to fix once in this suite). Also filtered to references
 * that actually start with "DEP-": some historical fixture data uses other
 * reference prefixes (e.g. "P57I-DEP-B-..."), which the spec's own
 * `text=/^DEP-/` locator would never match, so a deposit with such a
 * reference is not a usable fixture for this test even though it exists.
 */
export async function findOrgATenantIdWithDeposit(page: Page): Promise<string | null> {
  return withPageSession(page, async (client) => {
    const { data } = await client
      .from("security_deposits")
      .select("tenant_id")
      .ilike("deposit_reference", "DEP-%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.tenant_id as string | undefined) ?? null;
  });
}

/**
 * A tenant id whose deposit has been received and then fully drawn down
 * (received - deducted - refunded = 0), i.e. Held = 0 but the deposit row
 * still exists. The held computation can't be expressed as a single simple
 * column filter, so a bounded page of deposits is read and filtered
 * client-side -- still a plain, read-only select, still scoped by RLS
 * alone. Same "DEP-%" reference-format and newest-first reasoning as
 * findOrgATenantIdWithDeposit above.
 */
export async function findOrgATenantIdWithZeroHeldDeposit(page: Page): Promise<string | null> {
  return withPageSession(page, async (client) => {
    const { data } = await client
      .from("security_deposits")
      .select("tenant_id, received_amount, deducted_amount, refunded_amount")
      .ilike("deposit_reference", "DEP-%")
      .order("created_at", { ascending: false })
      .limit(200);
    const zeroHeld = (data ?? []).find((row) => {
      const received = Number(row.received_amount);
      const held = received - Number(row.deducted_amount) - Number(row.refunded_amount);
      return received > 0 && held === 0;
    });
    return (zeroHeld?.tenant_id as string | undefined) ?? null;
  });
}

/**
 * A tenant id that has at least one tenant_exits row. Ordered newest first
 * to match /app/exits' own default sort (lib/queries/tenantExits.ts orders
 * by created_at descending, page size 25) -- same pagination-visibility
 * reasoning as findOrgATenantIdWithDeposit above. Also filtered to
 * references that actually start with "EXIT-": lib/mutations/tenantExits.ts
 * generates every exit_reference via generateReference("EXIT") (P5.16
 * confirmed this directly), so "EXIT-" is the true, permanent format, not
 * "EXT-" (the earlier P5.14 version of this filter matched the spec's own
 * pre-P5.16 typo instead of the real generator). Some historical fixture
 * data also uses ad-hoc formats (e.g. "P57K-TEST-A-..."), so this filter
 * still matters -- it is not a no-op. If no "EXIT-"-prefixed exit currently
 * exists, this correctly returns null so the caller skips cleanly.
 */
export async function findOrgATenantIdWithExit(page: Page): Promise<string | null> {
  return withPageSession(page, async (client) => {
    const { data } = await client
      .from("tenant_exits")
      .select("tenant_id")
      .ilike("exit_reference", "EXIT-%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.tenant_id as string | undefined) ?? null;
  });
}
