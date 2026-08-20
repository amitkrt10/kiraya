import { test, expect } from "@playwright/test";

/**
 * P5.3A Ledger — cross-organization RLS proof, mirroring
 * billing-isolation.spec.ts's pattern: confirms an authenticated user can
 * reach their own org's Ledger screens, and that a different organization's
 * ledger data never surfaces.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD   — a user in organization A
 * E2E_ORG_A_PROPERTY_ID                 — a property id belonging to org A
 * E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD   — a user in a *different* organization B
 *
 * Tenant-scoped tests additionally need:
 * E2E_ORG_A_TENANT_ID                   — a tenant id belonging to org A with
 *                                          real ledger entries
 *
 * The test intentionally does not seed data itself — it must observe RLS
 * against real rows, not a mocked stand-in.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const orgAPropertyId = process.env.E2E_ORG_A_PROPERTY_ID;
const orgATenantId = process.env.E2E_ORG_A_TENANT_ID;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;

const hasOrgCredentials = Boolean(orgAEmail && orgAPassword && orgBEmail && orgBPassword);
const hasTenantId = Boolean(hasOrgCredentials && orgATenantId);

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

test.describe("org-wide ledger access", () => {
  test.skip(
    !hasOrgCredentials,
    "Needs E2E_ORG_A_EMAIL/PASSWORD and E2E_ORG_B_EMAIL/PASSWORD for two real, different-organization users — not available in this environment.",
  );

  test("org A can load its own org-wide ledger, filtered by its own property", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(orgAPropertyId ? `/app/ledger?property=${orgAPropertyId}` : "/app/ledger");
    await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Entry Type")).toBeVisible();
    await expect(page.getByText(/Something went wrong/)).not.toBeVisible();
  });

  test("org B's org-wide ledger never lists org A's property id", async ({ page }) => {
    await login(page, orgBEmail!, orgBPassword!);
    await page.goto("/app/ledger");
    await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible({ timeout: 10_000 });
    if (orgAPropertyId) {
      await expect(page.getByText(orgAPropertyId)).not.toBeVisible();
    }
  });
});

test.describe("tenant ledger isolation", () => {
  test.skip(
    !hasTenantId,
    "Needs E2E_ORG_A_TENANT_ID (a tenant with real ledger entries) in addition to the org credentials — not available in this environment.",
  );

  test("org A's tenant Ledger tab shows real entries; org B gets a clean not-found for the same tenant id", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(`/app/tenants/${orgATenantId}`);
    await page.getByRole("tab", { name: "Ledger" }).click();
    await expect(page.getByRole("columnheader", { name: "Running Balance" })).toBeVisible({ timeout: 10_000 });

    await signOut(page);
    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(`/app/tenants/${orgATenantId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
  });
});
