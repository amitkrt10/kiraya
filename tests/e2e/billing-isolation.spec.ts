import { test, expect } from "@playwright/test";
import { findOrgABillId, findOrgABillingRunId } from "./helpers/fixtures";

/**
 * Cross-organization RLS proof for P5.2D, mirroring
 * tenant-lease-isolation.spec.ts's pattern: confirms an authenticated user
 * from Organization A can read their own billing run and bill, and a user
 * from Organization B gets a clean "not found" for those same ids — never a
 * raw 403/leak of their existence.
 *
 * This can't run without real Supabase credentials and two seeded users in
 * different organizations. Populate these to run it:
 *
 *   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 *   E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD   — a user in organization A
 *   E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD   — a user in a *different* organization B
 *
 * The billing run/bill id used is E2E_ORG_A_RUN_ID/E2E_ORG_A_BILL_ID if set,
 * otherwise (P5.14) any existing org-A billing run/bill is discovered
 * dynamically via helpers/fixtures.ts, reusing the org-A session the test
 * has already signed into (via its cookie, not a second sign-in) — RLS
 * alone scopes the lookup, no explicit organization filter is used or
 * needed. If none exists yet, the affected test skips itself at runtime
 * with a clear reason.
 *
 * The test intentionally does not seed data itself — it must observe RLS
 * against real rows, not a mocked stand-in.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;

const hasCredentials = Boolean(orgAEmail && orgAPassword && orgBEmail && orgBPassword);

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

test.describe("cross-organization billing isolation", () => {
  test.skip(
    !hasCredentials,
    "Needs E2E_ORG_A_EMAIL/PASSWORD and E2E_ORG_B_EMAIL/PASSWORD for two real, different-organization users — not available in this environment.",
  );

  test("org A can read its own billing run; org B gets a clean not-found for the same id", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const orgARunId = process.env.E2E_ORG_A_RUN_ID ?? (await findOrgABillingRunId(page));
    test.skip(!orgARunId, "No billing run currently exists for org A to use as a dynamic fixture.");

    await page.goto(`/app/billing/runs/${orgARunId}`);
    await expect(page.getByText(/RUN-/)).toBeVisible({ timeout: 10_000 });

    await signOut(page);
    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(`/app/billing/runs/${orgARunId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
  });

  test("org A can read its own bill; org B gets a clean not-found for the same id", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const orgABillId = process.env.E2E_ORG_A_BILL_ID ?? (await findOrgABillId(page));
    test.skip(!orgABillId, "No bill currently exists for org A to use as a dynamic fixture.");

    await page.goto(`/app/billing/bills/${orgABillId}`);
    // .first(): a bill whose tenant has real available credit also renders
    // "Void Bill"/"Apply Credit — Bill INV-..." dialog titles containing the
    // same bill number (found directly: this is a real, pre-existing
    // ambiguity in this locator, not something P5.16 introduced -- it just
    // never surfaced against the hosted fixture's dynamically-picked bill
    // before).
    await expect(page.getByText(/INV-/).first()).toBeVisible({ timeout: 10_000 });

    await signOut(page);
    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(`/app/billing/bills/${orgABillId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("button", { name: "Finalize Bill" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Void Bill" })).not.toBeVisible();
  });

  test("org B's billing dashboard never lists org A's runs or bills", async ({ page }) => {
    // Discover an org-A run id while signed in as org A, then switch to
    // org B for the actual isolation assertion.
    await login(page, orgAEmail!, orgAPassword!);
    const orgARunId = process.env.E2E_ORG_A_RUN_ID ?? (await findOrgABillingRunId(page));
    test.skip(!orgARunId, "No billing run currently exists for org A to use as a dynamic fixture.");
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);
    await page.goto("/app/billing");
    await expect(page.getByText(orgARunId!)).not.toBeVisible();
  });
});
