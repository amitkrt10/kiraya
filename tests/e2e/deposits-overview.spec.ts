import { test, expect } from "@playwright/test";
import { findOrgATenantIdWithDeposit, findOrgATenantIdWithZeroHeldDeposit } from "./helpers/fixtures";

/**
 * P5.4G Security Deposits overview — org-wide `/app/deposits` read/
 * navigation surface, mirroring the established pattern (tenant-exits-
 * list.spec.ts, security-deposit.spec.ts): logs in with a real session and
 * drives the actual screens, not a mocked component.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD              — a user in organization A
 * E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD              — a user in a *different*
 *                                                     organization B
 *
 * The "existing deposit" and "zero-held deposit" tests use
 * E2E_ORG_A_EXISTING_DEPOSIT_TENANT_ID / E2E_ORG_A_ZERO_HELD_DEPOSIT_TENANT_ID
 * if set (distinct from E2E_ORG_A_DEPOSIT_TENANT_ID, which security-deposit.
 * spec.ts requires to have NO deposit yet), otherwise (P5.14) dynamically
 * discover a matching tenant via helpers/fixtures.ts using the same
 * authenticated org-A session. If none exists, they skip themselves at
 * runtime.
 *
 * This test intentionally does not seed data itself — it observes the real
 * UI against real rows, not a mocked stand-in.
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

  test("P6.3-J: org A sees its own deposit, and the row links into the deposit's exact occupancy — never a generic tenant or unit context", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const existingDepositTenantId =
      process.env.E2E_ORG_A_EXISTING_DEPOSIT_TENANT_ID ?? (await findOrgATenantIdWithDeposit(page));
    test.skip(!existingDepositTenantId, "No tenant with a security_deposits row currently exists for org A to use as a dynamic fixture.");

    // Discover the deposit's own reference from the tenant's Deposit tab, then confirm the org-wide overview surfaces the same deposit.
    await page.goto(`/app/tenants/${existingDepositTenantId}`);
    await page.getByRole("tab", { name: "Deposit" }).click();
    const depositReference = await page.locator("text=/^DEP-/").first().textContent();
    expect(depositReference).toBeTruthy();

    await page.goto("/app/deposits");
    const referenceLink = page.getByRole("link", { name: depositReference!.trim() });
    await expect(referenceLink).toBeVisible();
    // Never the ambiguous Tenant Detail ?tab=deposit route, and never the
    // bare unit page either — both can resolve to a different
    // deposit/occupancy than the one clicked here (P6.3-G/P6.3-I).
    await expect(referenceLink).toHaveAttribute("href", /^\/app\/units\/[0-9a-f-]+\/occupancies\/[0-9a-f-]+$/);

    // Clicking through lands on this deposit's exact occupancy, whose Deposit tab shows the same reference.
    await referenceLink.click();
    await page.waitForURL(/\/app\/units\/[0-9a-f-]+\/occupancies\/[0-9a-f-]+$/);
    await page.getByRole("tab", { name: "Deposit" }).click();
    await expect(page.getByText(depositReference!.trim())).toBeVisible();

    await signOut(page);
  });

  test("org B cannot see org A's deposit in the overview", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const existingDepositTenantId =
      process.env.E2E_ORG_A_EXISTING_DEPOSIT_TENANT_ID ?? (await findOrgATenantIdWithDeposit(page));
    test.skip(!existingDepositTenantId, "No tenant with a security_deposits row currently exists for org A to use as a dynamic fixture.");

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
    !hasCredentials,
    "Needs E2E_ORG_A_EMAIL/PASSWORD and E2E_ORG_B_EMAIL/PASSWORD — not available in this environment.",
  );

  test("a deposit with Held = 0 still appears as a real row, not the empty state", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const zeroHeldDepositTenantId =
      process.env.E2E_ORG_A_ZERO_HELD_DEPOSIT_TENANT_ID ?? (await findOrgATenantIdWithZeroHeldDeposit(page));
    test.skip(
      !zeroHeldDepositTenantId,
      "No tenant with a fully-deducted/refunded (Held = 0) deposit currently exists for org A to use as a dynamic fixture.",
    );

    await page.goto(`/app/tenants/${zeroHeldDepositTenantId}`);
    await page.getByRole("tab", { name: "Deposit" }).click();
    const depositReference = (await page.locator("text=/^DEP-/").first().textContent())!.trim();

    await page.goto("/app/deposits");
    await expect(page.getByRole("link", { name: depositReference })).toBeVisible();
    await expect(page.getByText("No security deposits yet")).not.toBeVisible();

    await signOut(page);
  });
});
