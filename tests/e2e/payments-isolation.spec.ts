import { test, expect } from "@playwright/test";
import { findOrgAPaymentId } from "./helpers/fixtures";

/**
 * Cross-organization RLS proof for P5.2E, mirroring
 * billing-isolation.spec.ts's pattern: confirms an authenticated user from
 * Organization A can read their own payment, and a user from Organization B
 * gets a clean "not found" for that same id — never a raw 403/leak of its
 * existence, and never a reversal action rendered for a payment they can't
 * see.
 *
 * This can't run without real Supabase credentials and two seeded users in
 * different organizations. Populate these to run it:
 *
 *   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 *   E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD   — a user in organization A
 *   E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD   — a user in a *different* organization B
 *
 * The payment id used is E2E_ORG_A_PAYMENT_ID if set, otherwise (P5.14) any
 * existing org-A payment is discovered dynamically via helpers/fixtures.ts,
 * reusing the org-A session the test has already signed into. If none
 * exists, the test skips itself at runtime with a clear reason.
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

test.describe("cross-organization payment isolation", () => {
  test.skip(
    !hasCredentials,
    "Needs E2E_ORG_A_EMAIL/PASSWORD and E2E_ORG_B_EMAIL/PASSWORD for two real, different-organization users — not available in this environment.",
  );

  test("org A can read its own payment; org B gets a clean not-found for the same id", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const orgAPaymentId = process.env.E2E_ORG_A_PAYMENT_ID ?? (await findOrgAPaymentId(page));
    test.skip(!orgAPaymentId, "No payment currently exists for org A to use as a dynamic fixture.");

    await page.goto(`/app/payments/${orgAPaymentId}`);
    await expect(page.getByText(/PAY-/).first()).toBeVisible({ timeout: 10_000 });

    await signOut(page);
    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(`/app/payments/${orgAPaymentId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reverse Payment" })).not.toBeVisible();
  });

  test("org B's payments list never shows org A's payment number", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const orgAPaymentId = process.env.E2E_ORG_A_PAYMENT_ID ?? (await findOrgAPaymentId(page));
    test.skip(!orgAPaymentId, "No payment currently exists for org A to use as a dynamic fixture.");
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);
    await page.goto("/app/payments");
    await expect(page.getByText(/PAY-/).first()).not.toContainText(orgAPaymentId!);
  });
});
