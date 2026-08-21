import { test, expect } from "@playwright/test";

/**
 * P5.4G Security Deposits overview — org-wide `/app/deposits` read/
 * navigation surface, mirroring the established pattern (tenant-exits-
 * list.spec.ts, security-deposit.spec.ts): logs in with a real session and
 * drives the actual screens, not a mocked component.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD              — a user in organization A
 * E2E_ORG_A_EXISTING_DEPOSIT_TENANT_ID             — a tenant in org A that
 *                                                     already has a
 *                                                     security_deposits row
 *                                                     (distinct from
 *                                                     E2E_ORG_A_DEPOSIT_TENANT_ID,
 *                                                     which security-deposit.
 *                                                     spec.ts requires to have
 *                                                     NO deposit yet)
 * E2E_ORG_A_ZERO_HELD_DEPOSIT_TENANT_ID            — optional: a tenant in
 *                                                     org A whose deposit has
 *                                                     been fully deducted/
 *                                                     refunded (held = 0) but
 *                                                     the deposit row still
 *                                                     exists
 * E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD              — a user in a *different*
 *                                                     organization B
 *
 * This test intentionally does not seed data itself — it observes the real
 * UI against real rows, not a mocked stand-in.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const existingDepositTenantId = process.env.E2E_ORG_A_EXISTING_DEPOSIT_TENANT_ID;
const zeroHeldDepositTenantId = process.env.E2E_ORG_A_ZERO_HELD_DEPOSIT_TENANT_ID;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;

const hasCredentials = Boolean(orgAEmail && orgAPassword && orgBEmail && orgBPassword);
const hasExistingDeposit = Boolean(existingDepositTenantId);
const hasZeroHeldDeposit = Boolean(zeroHeldDepositTenantId);

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

test.describe("Security Deposits overview", () => {
  test.skip(!hasCredentials, "Needs E2E_ORG_A_EMAIL/PASSWORD and E2E_ORG_B_EMAIL/PASSWORD — not available in this environment.");

  test("org A can load /app/deposits", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto("/app/deposits");
    // exact:true disambiguates from the Topbar's global search input, whose accessible
    // name ("Search tenants, bills, units…") otherwise matches "Search" as a substring.
    await expect(page.getByLabel("Search", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Status")).toBeVisible();
    await signOut(page);
  });

  test("empty state renders when filters match nothing", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto("/app/deposits?q=NO-SUCH-DEPOSIT-REFERENCE-XYZ");
    await expect(page.getByText("No deposits match your filters")).toBeVisible();
    await signOut(page);
  });

  test("org A sees its own deposit, and the row links into the tenant's Deposit tab", async ({ page }) => {
    test.skip(!hasExistingDeposit, "Needs E2E_ORG_A_EXISTING_DEPOSIT_TENANT_ID — a tenant in org A with a security_deposits row.");

    await login(page, orgAEmail!, orgAPassword!);

    // Discover the deposit's own reference from the tenant's Deposit tab, then confirm the org-wide overview surfaces the same deposit.
    await page.goto(`/app/tenants/${existingDepositTenantId}`);
    await page.getByRole("tab", { name: "Deposit" }).click();
    const depositReference = await page.locator("text=/^DEP-/").first().textContent();
    expect(depositReference).toBeTruthy();

    await page.goto("/app/deposits");
    const referenceLink = page.getByRole("link", { name: depositReference!.trim() });
    await expect(referenceLink).toBeVisible();

    // Clicking through lands directly on the tenant's Deposit tab, not Overview.
    await referenceLink.click();
    await page.waitForURL(new RegExp(`/app/tenants/${existingDepositTenantId}\\?tab=deposit`));
    await expect(page.getByRole("tab", { name: "Deposit", selected: true })).toBeVisible();
    await expect(page.getByText(depositReference!.trim())).toBeVisible();

    await signOut(page);
  });

  test("org B cannot see org A's deposit in the overview", async ({ page }) => {
    test.skip(!hasExistingDeposit, "Needs E2E_ORG_A_EXISTING_DEPOSIT_TENANT_ID — a tenant in org A with a security_deposits row.");

    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(`/app/tenants/${existingDepositTenantId}`);
    await page.getByRole("tab", { name: "Deposit" }).click();
    const depositReference = (await page.locator("text=/^DEP-/").first().textContent())!.trim();
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);

    // Direct navigation to org A's tenant/deposit tab is a clean not-found for org B.
    await page.goto(`/app/tenants/${existingDepositTenantId}?tab=deposit`);
    await expect(page.getByText("Page not found")).toBeVisible();

    // Org A's deposit reference never appears anywhere in org B's full, unfiltered overview.
    await page.goto("/app/deposits");
    await expect(page.getByRole("link", { name: depositReference })).not.toBeVisible();
    await signOut(page);
  });
});

test.describe("Security Deposits overview — zero-held deposit", () => {
  test.skip(
    !hasZeroHeldDeposit,
    "Needs E2E_ORG_A_ZERO_HELD_DEPOSIT_TENANT_ID — a tenant in org A whose deposit is fully deducted/refunded (held = 0).",
  );

  test("a deposit with Held = 0 still appears as a real row, not the empty state", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);

    await page.goto(`/app/tenants/${zeroHeldDepositTenantId}`);
    await page.getByRole("tab", { name: "Deposit" }).click();
    const depositReference = (await page.locator("text=/^DEP-/").first().textContent())!.trim();

    await page.goto("/app/deposits");
    await expect(page.getByRole("link", { name: depositReference })).toBeVisible();
    await expect(page.getByText("No security deposits yet")).not.toBeVisible();

    await signOut(page);
  });
});
