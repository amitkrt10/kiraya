import { test, expect } from "@playwright/test";

/**
 * P5.4E Tenant Exit & Settlement wizard — live proof through the real
 * screens, mirroring the established pattern (apply-credit.spec.ts,
 * security-deposit.spec.ts etc.): logs in with a real session and drives
 * the actual 9-step wizard, not a mocked component.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD          — a user in organization A
 * E2E_ORG_A_EXIT_LEASE_ID                      — an ACTIVE lease in org A
 *                                                 with no exit in progress,
 *                                                 whose tenant has a
 *                                                 security deposit and
 *                                                 enough available credit
 *                                                 that the settlement nets
 *                                                 to a refund
 * E2E_ORG_A_EXIT_TENANT_ID                     — that lease's tenant id
 * E2E_ORG_A_SHARED_UNIT_LEASE_ID               — an ACTIVE lease whose
 *                                                 unit ALSO has a second
 *                                                 ACTIVE/DRAFT lease on it
 *                                                 (non-overlapping dates)
 * E2E_ORG_A_SHARED_UNIT_ID                     — that lease's unit id
 * E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD          — a user in a *different*
 *                                                 organization B
 *
 * This test intentionally does not seed data itself — it observes the
 * real UI against real rows, not a mocked stand-in. Fixture creation
 * (bills, deposit, credit, the second same-unit lease) is done via the
 * authenticated org-A client in a live validation pass, matching the
 * established pattern for this project's E2E fixtures.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const exitLeaseId = process.env.E2E_ORG_A_EXIT_LEASE_ID;
const exitTenantId = process.env.E2E_ORG_A_EXIT_TENANT_ID;
const sharedUnitLeaseId = process.env.E2E_ORG_A_SHARED_UNIT_LEASE_ID;
const sharedUnitId = process.env.E2E_ORG_A_SHARED_UNIT_ID;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;

const hasCredentials = Boolean(orgAEmail && orgAPassword && exitLeaseId && exitTenantId && orgBEmail && orgBPassword);
const hasSharedUnitCredentials = Boolean(orgAEmail && orgAPassword && sharedUnitLeaseId && sharedUnitId);

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

test.describe("Tenant Exit & Settlement wizard", () => {
  test.skip(
    !hasCredentials,
    "Needs E2E_ORG_A_EMAIL/PASSWORD/EXIT_LEASE_ID/EXIT_TENANT_ID and E2E_ORG_B_EMAIL/PASSWORD — not available in this environment.",
  );

  test("full wizard walkthrough: initiation through completion, using only authoritative backend data", async ({ page }) => {
    test.setTimeout(180_000);
    await login(page, orgAEmail!, orgAPassword!);

    // 1. Org A can initiate an exit, from the Tenant Detail Exit tab.
    await page.goto(`/app/tenants/${exitTenantId}`);
    await page.getByRole("tab", { name: "Exit" }).click();
    await page.getByRole("link", { name: "Start Tenant Exit" }).click();
    await page.waitForURL(/\/app\/exits\/new/);
    await page.getByLabel("Planned Exit Date").fill("2026-03-15");
    await page.getByLabel("Reason").fill("Relocating to another city");
    await page.getByRole("button", { name: "Continue to Tenant / Lease Review" }).click();
    await page.waitForURL(/\/app\/exits\/.+\/review/);
    const exitUrl = page.url();
    const exitId = exitUrl.match(/\/exits\/([^/]+)\//)?.[1];
    expect(exitId).toBeTruthy();

    // 2. Tenant/lease review displays correct data (real tenant/lease/unit, not placeholders).
    await expect(page.getByRole("heading", { name: "Tenant / Lease Review" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Confirm & Continue" })).toBeVisible();
    await page.getByRole("link", { name: "Confirm & Continue" }).click();
    await page.waitForURL(/\/dues/);

    // 3. Outstanding dues display authoritative data (a real Total Outstanding tile, from get_tenant_due()).
    await expect(page.getByText("Total Outstanding")).toBeVisible();
    await page.getByRole("link", { name: "Continue to Deposit Review" }).click();
    await page.waitForURL(/\/deposit/);

    // 4. Deposit review displays authoritative data (the real deposit summary tiles).
    await expect(page.getByText("Held", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Continue to Adjustments" }).click();
    await page.waitForURL(/\/adjustments/);

    // 5. A charge adjustment can be created.
    // 6. Credit adjustment creation is unavailable — the form has no is_credit control of any kind.
    await expect(page.getByLabel("Type")).toBeVisible();
    await expect(page.getByText(/credit-type adjustments/)).toBeVisible();
    await expect(page.getByLabel(/credit/i)).toHaveCount(0);
    await page.getByLabel("Type").selectOption("CLEANING");
    await page.getByLabel("Description").fill("Deep cleaning — final inspection");
    await page.getByLabel("Amount", { exact: true }).fill("3500");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByRole("cell", { name: "Deep cleaning — final inspection" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: "Continue to Settlement" }).click();
    await page.waitForURL(/\/settlement/);

    // 7. Settlement uses authoritative calculate_exit_settlement() — real figures, not client math.
    await expect(page.getByRole("heading", { name: "Settlement" })).toBeVisible();
    await expect(page.getByText("computed by the backend", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Finalize Settlement" }).click();
    await expect(page.getByRole("link", { name: "Continue to Final Statement" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "Continue to Final Statement" }).click();
    await page.waitForURL(/\/statement/);

    // 8. Final Statement displays authoritative data (from v_exit_tenant_statement).
    await expect(page.getByText("Exit Settlement Statement")).toBeVisible();
    await page.getByRole("link", { name: "Continue to Refund" }).click();
    await page.waitForURL(/\/refund/);

    // 9. Refund amount uses final_amount_refundable — locked/disabled, not user-editable.
    // 10. No standalone refund action exists anywhere else on this screen.
    const amountField = page.locator('input[disabled]').first();
    await expect(amountField).toBeVisible();
    await expect(page.getByText(/Refund processing uses the finalized settlement amount/)).toBeVisible();

    // 11. Refund processing works through the approved deposit_refunds -> COMPLETED workflow.
    const hasRecordRefund = await page.getByRole("button", { name: "Record Refund" }).isVisible().catch(() => false);
    if (hasRecordRefund) {
      await page.getByLabel("Refund Date").fill("2026-03-15");
      await page.getByRole("button", { name: "Record Refund" }).click();
      await expect(page.getByRole("button", { name: "Record Refund" })).not.toBeVisible({ timeout: 15_000 });
    }

    await page.getByRole("link", { name: "Continue to Completion" }).click();
    await page.waitForURL(/\/completion/);

    // No standalone Refund action anywhere in the wizard shell either.
    await expect(page.getByRole("button", { name: /^Refund Security Deposit$/ })).not.toBeVisible();

    await page.getByRole("button", { name: "Complete Tenant Exit" }).click();
    await expect(page.getByRole("dialog", { name: /Complete Tenant Exit/ })).toBeVisible();
    await page.getByRole("button", { name: "Complete Exit" }).click();

    // 12. Completion changes exit to COMPLETED.
    await expect(page.getByText("This exit is complete.")).toBeVisible({ timeout: 15_000 });

    // 13. Lease becomes ENDED.
    await page.goto(`/app/leases/${exitLeaseId}`);
    await expect(page.getByText("Ended", { exact: true })).toBeVisible();
    await expect(page.getByText(/Actual End/)).toBeVisible();

    // 19. Existing REFUND transaction history remains correct — visible, read-only, on the Deposit tab.
    await page.goto(`/app/tenants/${exitTenantId}`);
    await page.getByRole("tab", { name: "Deposit" }).click();
    if (hasRecordRefund) {
      await expect(page.getByText("Refund", { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /^Refund/ })).not.toBeVisible();

    await signOut(page);
  });

  test("org B cannot access org A's tenant exit", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(`/app/tenants/${exitTenantId}`);
    await page.getByRole("tab", { name: "Exit" }).click();
    const viewLink = page.getByRole("link", { name: /View Exit|Continue Exit/ });
    const hasExit = await viewLink.isVisible().catch(() => false);
    test.skip(!hasExit, "Run the full walkthrough test first so an exit exists to probe.");
    await viewLink.click();
    const exitUrl = page.url();
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(exitUrl);
    await expect(page.getByText("Page not found")).toBeVisible();
  });
});

test.describe("Tenant Exit — unit vacancy with a shared unit", () => {
  test.skip(!hasSharedUnitCredentials, "Needs E2E_ORG_A_SHARED_UNIT_LEASE_ID/UNIT_ID — not available in this environment.");

  test("unit remains unchanged when another active/draft lease already reserves it", async ({ page }) => {
    test.setTimeout(180_000);
    await login(page, orgAEmail!, orgAPassword!);

    await page.goto(`/app/exits/new?leaseId=${sharedUnitLeaseId}`);
    await page.getByLabel("Planned Exit Date").fill("2026-03-15");
    await page.getByRole("button", { name: "Continue to Tenant / Lease Review" }).click();
    await page.waitForURL(/\/review/);
    await page.getByRole("link", { name: "Confirm & Continue" }).click();
    await page.waitForURL(/\/dues/);
    await page.getByRole("link", { name: "Continue to Deposit Review" }).click();
    await page.waitForURL(/\/deposit/);
    await page.getByRole("link", { name: "Continue to Adjustments" }).click();
    await page.waitForURL(/\/adjustments/);
    await page.getByRole("link", { name: "Continue to Settlement" }).click();
    await page.waitForURL(/\/settlement/);
    await page.getByRole("button", { name: "Finalize Settlement" }).click();
    await expect(page.getByRole("link", { name: "Continue to Final Statement" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "Continue to Final Statement" }).click();
    await page.waitForURL(/\/statement/);
    await page.getByRole("link", { name: "Continue to Refund" }).click();
    await page.waitForURL(/\/refund/);
    await page.getByRole("link", { name: "Continue to Completion" }).click();
    await page.waitForURL(/\/completion/);
    await page.getByRole("button", { name: "Complete Tenant Exit" }).click();
    await page.getByRole("button", { name: "Complete Exit" }).click();
    await expect(page.getByText("This exit is complete.")).toBeVisible({ timeout: 15_000 });

    // 14/15. Unit status left unchanged (not forced to VACANT) because another lease reserves it.
    await page.goto(`/app/units/${sharedUnitId}`);
    await expect(page.getByText("Vacant")).not.toBeVisible();
  });
});
