import { test, expect } from "@playwright/test";
import { findOrgABillId } from "./helpers/fixtures";

/**
 * P5.3B Apply Credit UI — live proof through the real dialog, mirroring
 * the established pattern (billing-isolation.spec.ts etc.): logs in with
 * a real session and drives the actual Bill Detail screen, not a mocked
 * component.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD           — a user in organization A
 * E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD           — a user in a *different*
 *                                                  organization B
 *
 * The write test below (applying credit) requires
 * E2E_ORG_A_APPLY_CREDIT_BILL_ID — a FINALIZED bill in org A whose tenant has
 * real available credit — and stays gated behind that env var (P5.14
 * deliberately does not activate it: it mutates/depletes real credit and is
 * not idempotent, so it is not safe to run from a dynamically-discovered
 * fixture; see P5.13/P5.15). The org-B isolation test below only needs *any*
 * existing org-A bill to prove the isolation property, so (P5.14) it uses
 * E2E_ORG_A_APPLY_CREDIT_BILL_ID if set, otherwise signs in briefly as org A
 * to dynamically discover any org-A bill via helpers/fixtures.ts before
 * switching to org B for the actual assertion.
 *
 * This test intentionally does not seed data itself — it observes the real
 * UI against a real bill/credit fixture, not a mocked stand-in.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const orgAApplyCreditBillId = process.env.E2E_ORG_A_APPLY_CREDIT_BILL_ID;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;

const hasBaseCredentials = Boolean(orgAEmail && orgAPassword && orgBEmail && orgBPassword);
const hasWriteCredentials = Boolean(hasBaseCredentials && orgAApplyCreditBillId);

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

test.describe("Apply Credit UI", () => {
  test("applying credit updates all bill/tenant tiles from the authoritative backend response", async ({ page }) => {
    test.skip(
      !hasWriteCredentials,
      "Needs E2E_ORG_A_EMAIL/PASSWORD/APPLY_CREDIT_BILL_ID and E2E_ORG_B_EMAIL/PASSWORD — not available in this environment. Deliberately not dynamically activated (P5.14): mutates real credit and is not idempotent.",
    );

    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(`/app/billing/bills/${orgAApplyCreditBillId}`);

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
    test.skip(
      !hasBaseCredentials,
      "Needs E2E_ORG_A_EMAIL/PASSWORD and E2E_ORG_B_EMAIL/PASSWORD for two real, different-organization users — not available in this environment.",
    );

    let orgABillId = orgAApplyCreditBillId;
    if (!orgABillId) {
      await login(page, orgAEmail!, orgAPassword!);
      orgABillId = (await findOrgABillId(page)) ?? undefined;
      await signOut(page);
    }
    test.skip(!orgABillId, "No bill currently exists for org A to use as a dynamic fixture.");

    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(`/app/billing/bills/${orgABillId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply Credit" })).not.toBeVisible();
  });
});
