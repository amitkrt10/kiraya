import { test, expect } from "@playwright/test";

/**
 * P5.4C Security Deposit UI — live proof through the real screens,
 * mirroring the established pattern (apply-credit.spec.ts etc.): logs
 * in with a real session and drives the actual Tenant Detail Deposit
 * tab, not a mocked component.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD          — a user in organization A
 * E2E_ORG_A_DEPOSIT_TENANT_ID                  — a tenant in org A with
 *                                                 no security deposit yet
 * E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD          — a user in a *different*
 *                                                 organization B
 *
 * This test intentionally does not seed data itself — it observes the
 * real UI against a real tenant, not a mocked stand-in.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const depositTenantId = process.env.E2E_ORG_A_DEPOSIT_TENANT_ID;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;

const hasCredentials = Boolean(orgAEmail && orgAPassword && depositTenantId && orgBEmail && orgBPassword);

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

test.describe("Security Deposit UI", () => {
  test.skip(
    !hasCredentials,
    "Needs E2E_ORG_A_EMAIL/PASSWORD/DEPOSIT_TENANT_ID and E2E_ORG_B_EMAIL/PASSWORD — not available in this environment.",
  );

  test("empty state, record receipt, record deduction, no refund action, org B isolation", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(`/app/tenants/${depositTenantId}`);
    await page.getByRole("tab", { name: "Deposit" }).click();
    const depositPanel = page.getByRole("tabpanel", { name: "Deposit" });

    // No deposit yet — empty state with a Record Receipt CTA.
    await expect(page.getByText("No security deposit configured")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Record Receipt" }).click();

    const receiptDialog = page.getByRole("dialog", { name: /Record Deposit Receipt/ });
    await expect(receiptDialog).toBeVisible();
    await receiptDialog.getByLabel("Deposit Reference").fill(`DEP-E2E-${Date.now()}`);
    await receiptDialog.getByLabel("Required Amount").fill("50000");
    await receiptDialog.getByLabel("Amount", { exact: true }).fill("50000");
    await receiptDialog.getByLabel("Received Date").fill("2026-01-01");
    await receiptDialog.getByLabel("Description").fill("Deposit received in full");
    await receiptDialog.getByRole("button", { name: "Record Receipt" }).click();
    // The receipt is a two-step, non-transactional mutation (create deposit, then
    // insert the receipt transaction) — allow more time than the 5s toast
    // auto-dismiss before asserting on the dialog closing / resulting state.
    await expect(receiptDialog).not.toBeVisible({ timeout: 15_000 });

    // Summary reflects the receipt.
    await expect(depositPanel.getByText("Held", { exact: true })).toBeVisible();
    await expect(depositPanel.getByText("₹50,000.00").first()).toBeVisible();

    // No Refund action anywhere on this screen.
    await expect(page.getByRole("button", { name: /^Refund/ })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Process Refund" })).not.toBeVisible();

    // Record a deduction.
    await page.getByRole("button", { name: "Record Deduction" }).click();
    const deductionDialog = page.getByRole("dialog", { name: /Record Deposit Deduction/ });
    await expect(deductionDialog).toBeVisible();
    await deductionDialog.getByLabel("Amount").fill("5000");
    await deductionDialog.getByLabel("Deduction Date").fill("2026-02-01");
    await deductionDialog.getByLabel("Reason").fill("Cleaning charge");
    await deductionDialog.getByRole("button", { name: "Record Deduction" }).click();
    await expect(deductionDialog).not.toBeVisible({ timeout: 15_000 });

    // Transaction history shows both.
    await expect(depositPanel.getByRole("cell", { name: "Deposit received in full" })).toBeVisible();
    await expect(depositPanel.getByRole("cell", { name: "Cleaning charge" })).toBeVisible();

    await signOut(page);

    // Org B cannot see this tenant's deposit at all.
    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(`/app/tenants/${depositTenantId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
  });
});
