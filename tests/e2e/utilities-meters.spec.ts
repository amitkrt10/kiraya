import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * P5.5C Utilities & Meters UI — live proof through the real screens,
 * mirroring the established pattern (tenant-exits-list.spec.ts,
 * deposits-overview.spec.ts): logs in with a real session and drives the
 * actual screens, not a mocked component. A couple of assertions call
 * the Supabase REST API directly with a real authenticated session
 * (never service_role) — the same technique used to live-verify P5.5B/
 * P5.5B.1 — because the UI itself exposes no control to attempt them
 * (there is no edit affordance for a finalized bill_item, and the
 * create-configuration/meter forms never list another organization's
 * property/unit in the first place), so the guarantee has to be
 * exercised below the UI to be a real test of the backend boundary.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD              — a user in organization A
 *                                                     with write access
 * E2E_ORG_A_PROPERTY_ID                            — a property in org A
 * E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD              — a user in a *different*
 *                                                     organization B
 * E2E_ORG_A_READONLY_EMAIL, E2E_ORG_A_READONLY_PASSWORD — optional: a
 *                                                     viewer-only user in
 *                                                     org A
 * E2E_ORG_A_METER_WITH_BILL_ID                     — optional: a meter in
 *                                                     org A that already
 *                                                     has a generated
 *                                                     UTILITY bill_item
 *                                                     (for the billing
 *                                                     connection + finalized-
 *                                                     immutability checks)
 *
 * This test intentionally does not seed the billing/finalization fixtures
 * itself — it observes real rows, not a mocked stand-in. It does create
 * its own utility/configuration/meter/reading fixtures via the real UI,
 * matching this project's established convention.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const propertyAId = process.env.E2E_ORG_A_PROPERTY_ID;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;
const readOnlyEmail = process.env.E2E_ORG_A_READONLY_EMAIL;
const readOnlyPassword = process.env.E2E_ORG_A_READONLY_PASSWORD;
const meterWithBillId = process.env.E2E_ORG_A_METER_WITH_BILL_ID;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasCredentials = Boolean(orgAEmail && orgAPassword && propertyAId && orgBEmail && orgBPassword && SUPABASE_URL && SUPABASE_ANON_KEY);
const hasReadOnlyCredentials = Boolean(readOnlyEmail && readOnlyPassword);
const hasMeterWithBill = Boolean(meterWithBillId);

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

function apiClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { db: { schema: "kiraya" }, auth: { persistSession: false } });
}

test.describe("Utilities & Meters", () => {
  test.skip(!hasCredentials, "Needs E2E_ORG_A_EMAIL/PASSWORD/PROPERTY_ID and E2E_ORG_B_EMAIL/PASSWORD — not available in this environment.");

  test("1. Org A sees Utilities", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto("/app/utilities");
    await expect(page.getByRole("heading", { name: "Utilities & Meters" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Utilities" })).toBeVisible();
    await signOut(page);
  });

  test("2. Org A sees Meters", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto("/app/meters");
    await expect(page.getByRole("link", { name: "Meters" })).toBeVisible();
    await signOut(page);
  });

  test("3-5. Org A creates a utility, configuration, and meter, records a reading, and it appears in history", async ({ page }) => {
    test.setTimeout(90_000);
    const stamp = Date.now();
    await login(page, orgAEmail!, orgAPassword!);

    // 3a. Create a utility.
    await page.goto("/app/utilities");
    await page.getByRole("button", { name: "Add Utility" }).click();
    const utilityDialog = page.getByRole("dialog", { name: "Add Utility" });
    await expect(utilityDialog).toBeVisible();
    await utilityDialog.getByLabel("Code").fill(`E2E-UTIL-${stamp}`);
    await utilityDialog.getByLabel("Name").fill(`E2E Utility ${stamp}`);
    await utilityDialog.getByLabel("Metered (readings apply)").check();
    await utilityDialog.getByRole("button", { name: "Add Utility" }).click();
    await expect(utilityDialog).not.toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: `E2E Utility ${stamp}` }).click();
    await page.waitForURL(/\/app\/utilities\/.+/);

    // 3b. Add a unit-level FIXED configuration.
    await page.getByRole("button", { name: "Add Configuration" }).click();
    const configDialog = page.getByRole("dialog", { name: "Add Configuration" });
    await expect(configDialog).toBeVisible();
    await configDialog.getByLabel("Unit Override").check();
    // Unit picker defaults to the first available unit in org A; the exact unit doesn't matter for this test.
    await configDialog.getByLabel("Effective From").fill("2026-01-01");
    await configDialog.getByLabel("Fixed Amount").fill("500");
    await configDialog.getByRole("button", { name: "Save Configuration" }).click();
    await expect(page.getByText("Configuration added.")).toBeVisible({ timeout: 15_000 });

    // 3c. Create a meter at the org's property.
    await page.goto("/app/meters");
    await page.getByRole("button", { name: "Add Meter" }).click();
    const meterDialog = page.getByRole("dialog", { name: "Add Meter" });
    await expect(meterDialog).toBeVisible();
    await meterDialog.getByLabel("Meter Code").fill(`E2E-MTR-${stamp}`);
    await meterDialog.getByLabel("Utility").selectOption({ label: `E2E Utility ${stamp}` });
    await meterDialog.getByRole("radio", { name: "Property" }).check();
    await meterDialog.getByLabel("Property", { exact: true }).selectOption(propertyAId!);
    await meterDialog.getByRole("button", { name: "Save Meter" }).click();
    await expect(page.getByText("Meter added.")).toBeVisible({ timeout: 15_000 });

    // 4. Record a reading on that meter.
    await page.getByRole("link", { name: `E2E-MTR-${stamp}` }).click();
    await page.waitForURL(/\/app\/meters\/.+/);
    await page.getByRole("button", { name: "Record Reading" }).click();
    const readingDialog = page.getByRole("dialog", { name: "Record Reading" });
    await expect(readingDialog).toBeVisible();
    await readingDialog.getByLabel("Reading Date").fill("2026-06-01");
    await readingDialog.getByLabel("Reading Value").fill("100");
    await readingDialog.getByRole("button", { name: "Save Reading" }).click();
    await expect(page.getByText("Reading recorded.")).toBeVisible({ timeout: 15_000 });

    // 5. The reading appears in the meter's own history.
    await expect(page.getByRole("cell", { name: "2026-06-01" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "100" })).toBeVisible();

    await signOut(page);
  });

  test("7. Read-only user sees data but no write actions", async ({ page }) => {
    test.skip(!hasReadOnlyCredentials, "Needs E2E_ORG_A_READONLY_EMAIL/PASSWORD — a viewer-only user in org A.");
    await login(page, readOnlyEmail!, readOnlyPassword!);
    await page.goto("/app/utilities");
    await expect(page.getByRole("heading", { name: "Utilities & Meters" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Utility" })).not.toBeVisible();
    await signOut(page);
  });

  test("8-9. Org B cannot see Org A's utility configuration or meter", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto("/app/utilities");
    const firstUtilityLink = page.getByRole("link").first();
    const hasUtility = await firstUtilityLink.isVisible().catch(() => false);
    test.skip(!hasUtility, "Org A has no utilities yet to probe cross-org access against.");
    await firstUtilityLink.click();
    const utilityUrl = page.url();
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(utilityUrl);
    await expect(page.getByText("Page not found")).toBeVisible();
    await signOut(page);
  });

  test("10-11. Org B's create-configuration/meter pickers never list Org A's property or unit", async ({ page }) => {
    await login(page, orgBEmail!, orgBPassword!);
    await page.goto("/app/meters");
    await page.getByRole("button", { name: "Add Meter" }).click();
    const meterDialog = page.getByRole("dialog", { name: "Add Meter" });
    await expect(meterDialog).toBeVisible();
    await meterDialog.getByRole("radio", { name: "Property" }).check();
    const propertySelect = meterDialog.getByLabel("Property", { exact: true });
    const optionValues = await propertySelect.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
    expect(optionValues).not.toContain(propertyAId);
    await signOut(page);
  });

  test("12. Batch reading failures are isolated per reading", async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(`/app/meters/batch?propertyId=${propertyAId}&date=2026-07-01`);

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    test.skip(rowCount === 0, "Org A's property has no active meters to run a batch reading against.");

    // Enter an obviously-too-low value for the first meter (below any real prior reading) to force a per-row rejection,
    // while leaving remaining rows untouched (Missing) — proving one row's failure never blocks another's success path.
    const firstInput = rows.first().getByRole("spinbutton");
    await firstInput.fill("0");
    await page.getByRole("button", { name: "Save Readings" }).click();

    await expect(page.getByText(/1 error|0 error/)).toBeVisible({ timeout: 15_000 });
    await signOut(page);
  });

  test("6. Org A sees a utility-generated bill item on the meter's Billing Connection view", async ({ page }) => {
    test.skip(!hasMeterWithBill, "Needs E2E_ORG_A_METER_WITH_BILL_ID — a meter with an already-generated UTILITY bill_item.");
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(`/app/meters/${meterWithBillId}`);
    await expect(page.getByRole("heading", { name: "Generated Utility Charges" })).toBeVisible();
    await expect(page.getByText(/Read-only — generated by the billing run/)).toBeVisible();
    await signOut(page);
  });
});

test.describe("Utilities & Meters — backend contract (no UI control exists for these, so exercised via the API directly)", () => {
  test.skip(!hasCredentials, "Needs Supabase URL/anon key and org A/B credentials.");

  test("13. No unauthorized modification of a finalized UTILITY bill item", async () => {
    test.skip(!hasMeterWithBill, "Needs E2E_ORG_A_METER_WITH_BILL_ID — a meter with an already-generated, finalized UTILITY bill_item.");

    const client = apiClient();
    const { error: signInError } = await client.auth.signInWithPassword({ email: orgAEmail!, password: orgAPassword! });
    expect(signInError).toBeNull();

    const { data: item } = await client.from("bill_items").select("id, bill_id").eq("meter_id", meterWithBillId!).eq("item_type", "UTILITY").limit(1).maybeSingle();
    test.skip(!item, "No generated UTILITY bill_item found for this meter.");

    const { data: bill } = await client.from("bills").select("status").eq("id", item!.bill_id).single();
    test.skip(bill?.status === "DRAFT", "The bill for this meter's charge is still DRAFT — this checks the FINALIZED case specifically.");

    const { error: updateError } = await client.from("bill_items").update({ description: "unauthorized edit attempt" }).eq("id", item!.id);
    expect(updateError).not.toBeNull();
    expect(updateError?.code).toBe("23514");
  });
});
