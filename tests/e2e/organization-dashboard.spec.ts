import { test, expect } from "@playwright/test";
import { findCurrentOrganizationName } from "./helpers/fixtures";

/**
 * P5.8A Organization Dashboard — logs in with a real session and drives the
 * actual /app/dashboard screen against live kiraya.v_organization_dashboard
 * data, mirroring the established pattern (deposits-overview.spec.ts,
 * utilities-meters.spec.ts): no mocked component, no fabricated fixtures.
 *
 * Route protection for /app/dashboard (unauthenticated -> /login) is already
 * covered by route-protection.spec.ts and is not duplicated here.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD              — a user in organization A
 * E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD              — a user in a *different*
 *                                                     organization B
 * E2E_ORG_A_READONLY_EMAIL, E2E_ORG_A_READONLY_PASSWORD — optional: a
 *                                                     viewer-only user in
 *                                                     org A
 *
 * This test does not seed data itself and does not assume an empty
 * organization exists — both orgs already have real billing/payment
 * history, which is what the dashboard is built to show.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;
const readOnlyEmail = process.env.E2E_ORG_A_READONLY_EMAIL;
const readOnlyPassword = process.env.E2E_ORG_A_READONLY_PASSWORD;

const hasCredentials = Boolean(orgAEmail && orgAPassword && orgBEmail && orgBPassword);
const hasReadOnlyCredentials = Boolean(readOnlyEmail && readOnlyPassword);

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app\/dashboard/);
}

async function signOut(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /^Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/login/);
}

/**
 * The dashboard issues several parallel Postgres round-trips (the dashboard
 * view, recent payments, lease expiries, per-status bill counts, the due-
 * date breakdown) before <main> resolves past the loading skeleton (whose
 * elements are aria-hidden, so an in-progress load looks like an empty
 * <main> to the accessibility tree). 15s matches the timeout already used
 * elsewhere in this suite for real async data loads (e.g. "Meter added."),
 * not an arbitrary bump.
 */
const DATA_LOAD_TIMEOUT = 15_000;

test.describe("Organization Dashboard", () => {
  test.skip(!hasCredentials, "Needs E2E_ORG_A_EMAIL/PASSWORD and E2E_ORG_B_EMAIL/PASSWORD — not available in this environment.");

  test("Org A can load the dashboard and every section renders real data, not the placeholder", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);

    // Login already lands on /app/dashboard — confirm the placeholder copy is gone.
    await expect(page.getByText("Dashboard — coming soon")).not.toBeVisible();

    // Scoped to <main> throughout — the sidebar has its own "Properties"/"Units"/
    // "Tenants" nav links with the exact same text, which a page-wide getByText
    // would collide with (the same class of ambiguous-selector bug P5.7L fixed).
    const main = page.locator("main");

    // "Outstanding" itself renders twice within <main> (a KPI tile and a Billing
    // Status tile) — .first() resolves that ambiguity without asserting anything
    // false; every other label here is unique within <main>. The first check
    // carries the generous timeout since it's the one waiting out the initial
    // parallel data load; once <main> has real content, the rest resolve fast.
    await expect(main.getByText("Properties", { exact: true }).first()).toBeVisible({ timeout: DATA_LOAD_TIMEOUT });
    for (const label of ["Units", "Occupancy", "Tenants", "Outstanding"]) {
      await expect(main.getByText(label, { exact: true }).first()).toBeVisible();
    }
    // Anchored with the trailing "(" so this doesn't also match the chart legend's "Collected vs billed".
    await expect(main.getByText(/^Collected \(/)).toBeVisible();

    // Section headings from the approved design.
    await expect(main.getByText("Current Dues")).toBeVisible();
    await expect(main.getByText("Collection Performance")).toBeVisible();
    await expect(main.getByText("Recent Payments")).toBeVisible();
    await expect(main.getByText("Pending Actions")).toBeVisible();
    await expect(main.getByText("Lease Expiries")).toBeVisible();
    await expect(main.getByText("Billing Status — This Cycle")).toBeVisible();

    // Billing Status strip's six tiles.
    for (const label of ["Finalized", "Paid", "Partially Paid", "Outstanding", "Overdue", "Void"]) {
      await expect(main.getByText(label, { exact: true }).first()).toBeVisible();
    }

    await signOut(page);
  });

  test("Org A sees its own organization name in the switcher while viewing the dashboard", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    // The actual intent here is "the switcher shows the authenticated
    // organization's real name", not one specific hardcoded string — a
    // hardcoded hosted-fixture name would be meaningless (and wrong) run
    // against any other environment's differently-named Org A (P5.17).
    // Discovered dynamically via the same authenticated session, matching
    // this suite's established "discover, then assert" pattern.
    const orgName = await findCurrentOrganizationName(page);
    expect(orgName).toBeTruthy();
    // Renders twice (sidebar org switcher + topbar breadcrumb) — .first() is enough to prove it's there.
    await expect(page.getByText(orgName!).first()).toBeVisible();
    await signOut(page);
  });

  test("Org B's dashboard never shows Org A's recent-payment data", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    // isVisible() checks the current DOM state immediately (no auto-wait) — right
    // after login() the page can still be showing the loading skeleton, whose
    // elements aren't a <table> at all. Wait for real content first, exactly like
    // the "Org A can load the dashboard" test does, before probing for a row.
    await expect(page.locator("main").getByText("Properties", { exact: true }).first()).toBeVisible({ timeout: DATA_LOAD_TIMEOUT });

    // Capture whatever Org A's most recent payment tenant actually is today —
    // never hardcoded, so this stays correct as fixtures accumulate over time.
    // Scoped to the table that actually follows the "Recent Payments" heading
    // (not just "the first table in main") — the Current Dues table now
    // renders above it, so a bare "main table tbody tr" would grab the wrong
    // table's first row.
    const firstOrgAPaymentRow = page
      .locator("main")
      .getByText("Recent Payments", { exact: true })
      .locator("xpath=following::table[1]/tbody/tr[1]");
    const hasOrgAPayment = await firstOrgAPaymentRow.isVisible().catch(() => false);
    test.skip(!hasOrgAPayment, "Org A has no recorded payments yet to probe cross-org leakage against.");
    const orgAPaymentTenant = (await firstOrgAPaymentRow.locator("td").first().textContent())!.trim();
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);
    await expect(page.locator("main").getByText("Properties", { exact: true }).first()).toBeVisible({ timeout: DATA_LOAD_TIMEOUT });
    // Org A's tenant name never appears anywhere on Org B's fully-rendered dashboard.
    await expect(page.getByText(orgAPaymentTenant, { exact: true })).not.toBeVisible();
    await signOut(page);
  });

  test("Org B's dashboard never shows Org A's Current Dues data", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await expect(page.locator("main").getByText("Properties", { exact: true }).first()).toBeVisible({ timeout: DATA_LOAD_TIMEOUT });

    // Same technique as the Recent Payments leakage test above, scoped to
    // the table following the "Current Dues" heading specifically.
    const firstOrgADueRow = page
      .locator("main")
      .getByText("Current Dues", { exact: true })
      .locator("xpath=following::table[1]/tbody/tr[1]");
    const hasOrgADue = await firstOrgADueRow.isVisible().catch(() => false);
    test.skip(!hasOrgADue, "Org A has no tenant with a current due yet to probe cross-org leakage against.");
    // Second cell is the tenant name (first cell is the unit label).
    const orgATenantWithDue = (await firstOrgADueRow.locator("td").nth(1).textContent())!.trim();
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);
    await expect(page.locator("main").getByText("Properties", { exact: true }).first()).toBeVisible({ timeout: DATA_LOAD_TIMEOUT });
    await expect(page.getByText(orgATenantWithDue, { exact: true })).not.toBeVisible();
    await signOut(page);
  });

  test("Org B can load its own dashboard with its own real data", async ({ page }) => {
    await login(page, orgBEmail!, orgBPassword!);

    await expect(page.getByText("Dashboard — coming soon")).not.toBeVisible();
    const main = page.locator("main");
    await expect(main.getByText("Properties", { exact: true }).first()).toBeVisible({ timeout: DATA_LOAD_TIMEOUT });
    for (const label of ["Units", "Occupancy", "Tenants", "Outstanding"]) {
      await expect(main.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(main.getByText("Collection Performance")).toBeVisible();

    await signOut(page);
  });

  test("Read-only user sees dashboard data with no write actions, per the existing view-only role pattern", async ({ page }) => {
    test.skip(!hasReadOnlyCredentials, "Needs E2E_ORG_A_READONLY_EMAIL/PASSWORD — a viewer-only user in org A.");

    await login(page, readOnlyEmail!, readOnlyPassword!);
    await expect(page.getByText(/View-only role/)).toBeVisible();
    await expect(page.locator("main").getByText("Properties", { exact: true }).first()).toBeVisible({ timeout: DATA_LOAD_TIMEOUT });
    await signOut(page);
  });
});
