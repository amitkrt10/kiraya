import { test, expect } from "@playwright/test";

/**
 * Cross-organization RLS proof (task instruction #38): confirms an
 * authenticated user from Organization A can read their own property, and
 * a user from Organization B gets a clean "not found" for that same
 * property id — never a raw 403/leak of its existence.
 *
 * This can't run without real Supabase credentials and two seeded users in
 * different organizations (this environment has neither — see the P5.2B
 * report). Populate these to run it:
 *
 *   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 *   E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD   — a user in organization A
 *   E2E_ORG_A_PROPERTY_ID                 — a property id belonging to org A
 *   E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD   — a user in a *different* organization B
 *
 * The test intentionally does not seed data itself — it must observe RLS
 * against real rows, not a mocked stand-in.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const orgAPropertyId = process.env.E2E_ORG_A_PROPERTY_ID;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;

const hasCredentials = Boolean(orgAEmail && orgAPassword && orgAPropertyId && orgBEmail && orgBPassword);

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app\/dashboard/);
}

test.describe("cross-organization property/unit isolation", () => {
  test.skip(
    !hasCredentials,
    "Needs E2E_ORG_A_EMAIL/PASSWORD/PROPERTY_ID and E2E_ORG_B_EMAIL/PASSWORD for two real, different-organization users — not available in this environment.",
  );

  test("org A can read its own property; org B gets a clean not-found for the same id", async ({
    page,
  }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(`/app/properties/${orgAPropertyId}`);
    await expect(page.getByText("Edit Property")).toBeVisible({ timeout: 10_000 });

    // Sign out of org A via the account menu, then sign in as org B.
    await page.getByRole("button", { name: /^Account menu/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL(/\/login/);

    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(`/app/properties/${orgAPropertyId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByText("Edit Property")).not.toBeVisible();
  });
});
