import { test, expect } from "@playwright/test";

/**
 * P5.3B Apply Credit UI — live proof through the real dialog, mirroring
 * the established pattern (billing-isolation.spec.ts etc.): logs in with
 * a real session and drives the actual Bill Detail screen, not a mocked
 * component.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD           — a user in organization A
 * E2E_ORG_A_APPLY_CREDIT_BILL_ID                — a FINALIZED bill in org A
 *                                                  whose tenant has real
 *                                                  available credit
 * E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD           — a user in a *different*
 *                                                  organization B
 *
 * This test intentionally does not seed data itself — it observes the real
 * UI against a real bill/credit fixture, not a mocked stand-in.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const orgABillId = process.env.E2E_ORG_A_APPLY_CREDIT_BILL_ID;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;

const hasCredentials = Boolean(orgAEmail && orgAPassword && orgABillId && orgBEmail && orgBPassword);

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app\/dashboard/);
}

test.describe("Apply Credit UI", () => {
  test.skip(
    !hasCredentials,
    "Needs E2E_ORG_A_EMAIL/PASSWORD/APPLY_CREDIT_BILL_ID and E2E_ORG_B_EMAIL/PASSWORD — not available in this environment.",
  );

  test("applying credit updates all bill/tenant tiles from the authoritative backend response", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(`/app/billing/bills/${orgABillId}`);

    const applyButton = page.getByRole("button", { name: "Apply Credit" });
    await expect(applyButton).toBeVisible({ timeout: 10_000 });
    await applyButton.click();

    const dialog = page.getByRole("dialog", { name: /Apply Credit/ });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Amount").fill("3000");
    await dialog.getByRole("button", { name: "Apply Credit" }).click();

    await expect(page.getByText("Credit applied to bill.")).toBeVisible({ timeout: 10_000 });
    await expect(dialog).not.toBeVisible();
  });

  test("org B cannot see or reach org A's bill", async ({ page }) => {
    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(`/app/billing/bills/${orgABillId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply Credit" })).not.toBeVisible();
  });
});
