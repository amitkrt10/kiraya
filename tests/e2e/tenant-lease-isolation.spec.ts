import { test, expect } from "@playwright/test";
import { findOrgALeaseId, findOrgATenantId } from "./helpers/fixtures";

/**
 * Cross-organization RLS proof for P5.2C, mirroring
 * organization-isolation.spec.ts's pattern for properties/units: confirms an
 * authenticated user from Organization A can read their own tenant and
 * lease, and a user from Organization B gets a clean "not found" for those
 * same ids — never a raw 403/leak of their existence.
 *
 * This can't run without real Supabase credentials and two seeded users in
 * different organizations. Populate these to run it:
 *
 *   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 *   E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD   — a user in organization A
 *   E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD   — a user in a *different* organization B
 *
 * The tenant/lease id used is E2E_ORG_A_TENANT_ID/E2E_ORG_A_LEASE_ID if set,
 * otherwise (P5.14) any existing org-A tenant/lease is discovered
 * dynamically via helpers/fixtures.ts, reusing the org-A session the test
 * has already signed into. If none exists, the affected test skips itself
 * at runtime with a clear reason.
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

test.describe("cross-organization tenant/lease isolation", () => {
  test.skip(
    !hasCredentials,
    "Needs E2E_ORG_A_EMAIL/PASSWORD and E2E_ORG_B_EMAIL/PASSWORD for two real, different-organization users — not available in this environment.",
  );

  test("org A can read its own tenant; org B gets a clean not-found for the same id", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const orgATenantId = process.env.E2E_ORG_A_TENANT_ID ?? (await findOrgATenantId(page));
    test.skip(!orgATenantId, "No tenant currently exists for org A to use as a dynamic fixture.");

    await page.goto(`/app/tenants/${orgATenantId}`);
    // Scoped to the button role: "Edit Tenant" text also appears in the
    // (DOM-present but closed) form heading pattern used elsewhere, same
    // ambiguity fixed for properties in organization-isolation.spec.ts.
    await expect(page.getByRole("button", { name: "Edit Tenant" })).toBeVisible({ timeout: 10_000 });

    await signOut(page);
    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(`/app/tenants/${orgATenantId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit Tenant" })).not.toBeVisible();
  });

  test("org A can read its own lease; org B gets a clean not-found for the same id", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const orgALeaseId = process.env.E2E_ORG_A_LEASE_ID ?? (await findOrgALeaseId(page));
    test.skip(!orgALeaseId, "No lease currently exists for org A to use as a dynamic fixture.");

    await page.goto(`/app/leases/${orgALeaseId}`);
    await expect(page.getByRole("button", { name: "Edit Lease" })).toBeVisible({ timeout: 10_000 });

    await signOut(page);
    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(`/app/leases/${orgALeaseId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit Lease" })).not.toBeVisible();
  });

  test("org B's tenant/unit pickers on the lease-create form never list org A's records", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const orgATenantId = process.env.E2E_ORG_A_TENANT_ID ?? (await findOrgATenantId(page));
    test.skip(!orgATenantId, "No tenant currently exists for org A to use as a dynamic fixture.");
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);
    await page.goto("/app/leases/new");

    const tenantSelect = page.getByLabel("Tenant", { exact: true });
    const tenantOptionValues = await tenantSelect.locator("option").evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value),
    );
    expect(tenantOptionValues).not.toContain(orgATenantId);
  });
});
