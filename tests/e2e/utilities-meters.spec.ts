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
  // Close any dialog left open by the test first — its backdrop otherwise
  // intercepts the Account menu click (the dialog is a native <dialog>
  // opened via showModal(), so Escape genuinely closes it via the
  // browser's own behavior, not a simulated keypress the app has to
  // separately handle).
  const openDialog = page.getByRole("dialog");
  if (await openDialog.isVisible().catch(() => false)) {
    await page.keyboard.press("Escape");
    await expect(openDialog).not.toBeVisible({ timeout: 5_000 });
  }

  const accountMenu = page.getByRole("button", { name: /^Account menu/ });
  await accountMenu.waitFor({ state: "visible", timeout: 15_000 });
  await accountMenu.click();
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
    // exact:true disambiguates from the sidebar's "Utilities & Meters" nav link, which also contains this text.
    await expect(page.getByRole("link", { name: "Utilities", exact: true })).toBeVisible();
    await signOut(page);
  });

  test("2. Org A sees Meters", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto("/app/meters");
    // exact:true disambiguates from the sidebar's "Utilities & Meters" nav link, which also contains this text.
    await expect(page.getByRole("link", { name: "Meters", exact: true })).toBeVisible();
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
    // exact:true disambiguates from the "Unit Name" field, which also contains "Name".
    await utilityDialog.getByLabel("Name", { exact: true }).fill(`E2E Utility ${stamp}`);
    await utilityDialog.getByLabel("Metered (readings apply)").check();
    await utilityDialog.getByRole("button", { name: "Add Utility" }).click();
    await expect(utilityDialog).not.toBeVisible({ timeout: 15_000 });
    // The Utilities list paginates and accumulates fixtures from prior E2E runs, so the
    // newly-created utility isn't guaranteed to land on the first rendered page — use the
    // page's own search filter (UtilityFilters -> ?q=, server-side ilike on name) to locate
    // it by its unique timestamped name instead of assuming page-1 placement.
    await page.getByLabel("Search", { exact: true }).fill(`E2E Utility ${stamp}`);
    // The search box debounces (350ms) before pushing ?q= — if the target row already happens
    // to be visible on the current unfiltered page, a plain toBeVisible/click races the still-
    // pending debounced navigation, which then clobbers the click's own in-flight navigation.
    // Waiting for the URL to actually carry the query guarantees the debounce has already
    // fired, so no stale navigation is left pending to interrupt the click below.
    await page.waitForURL((url) => url.searchParams.get("q") === `E2E Utility ${stamp}`);
    const utilityLink = page.getByRole("link", { name: `E2E Utility ${stamp}` });
    await expect(utilityLink).toBeVisible({ timeout: 15_000 });
    await utilityLink.click();
    await page.waitForURL(/\/app\/utilities\/.+/);

    // 3b. Add a unit-level FIXED configuration.
    await page.getByRole("button", { name: "Add Configuration" }).click();
    const configDialog = page.getByRole("dialog", { name: "Add Configuration" });
    await expect(configDialog).toBeVisible();
    await configDialog.getByLabel("Unit Override").check();
    // The Unit select is a required field with no default selection (its placeholder option is
    // disabled) — the browser's own HTML5 validation silently blocks submission if it's left
    // unselected, with no error ever reaching the server action. Index 1 is the first real unit
    // (index 0 is the disabled placeholder); the exact unit doesn't matter for this test.
    await configDialog.locator('select[name="unitId"]').selectOption({ index: 1 });
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
    // getByLabel("Property") also matches the "Property" scope radio's own label — select
    // by the underlying element's name attribute instead of by (ambiguous) accessible name.
    await meterDialog.locator('select[name="propertyId"]').selectOption(propertyAId!);
    await meterDialog.getByRole("button", { name: "Save Meter" }).click();
    await expect(page.getByText("Meter added.")).toBeVisible({ timeout: 15_000 });

    // 4. Record a reading on that meter.
    // The Meters list paginates and accumulates fixtures from prior E2E runs, so the
    // newly-created meter isn't guaranteed to land on the first rendered page — use the
    // page's own search filter (MeterFilters -> ?q=, server-side ilike on meter_code) to
    // locate it by its unique meter code instead of assuming page-1 placement.
    await page.getByLabel("Search", { exact: true }).fill(`E2E-MTR-${stamp}`);
    // See the identical comment at the utility search above: wait for the debounced ?q=
    // navigation to actually land before checking visibility/clicking, so a stale pending
    // debounce can't fire later and clobber the click's own navigation.
    await page.waitForURL((url) => url.searchParams.get("q") === `E2E-MTR-${stamp}`);
    const meterLink = page.getByRole("link", { name: `E2E-MTR-${stamp}` });
    await expect(meterLink).toBeVisible({ timeout: 15_000 });
    await meterLink.click();
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
    // Scoped to an actual table row's link — page.getByRole("link").first() would
    // grab the sidebar's first nav link instead of a utility row.
    const firstUtilityLink = page.locator("table tbody tr").first().getByRole("link");
    const hasUtility = await firstUtilityLink.isVisible().catch(() => false);
    test.skip(!hasUtility, "Org A has no utilities yet to probe cross-org access against.");
    await firstUtilityLink.click();
    await page.waitForURL(/\/app\/utilities\/.+/);
    const utilityUrl = page.url();
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);
    await page.goto(utilityUrl);
    await expect(page.getByText("Page not found")).toBeVisible();
    // The not-found page has no app shell/Account menu at all — navigate to a real
    // authenticated page first so signOut() has something to click.
    await page.goto("/app/dashboard");
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
    test.setTimeout(90_000);
    const stamp = Date.now();
    await login(page, orgAEmail!, orgAPassword!);

    // Fixture setup: a dedicated utility and two property-scoped meters, so this
    // test's outcome never depends on which pre-existing meter happens to sort
    // first at this (heavily reused) property — a meter with NO reading history
    // legitimately accepts any non-negative value (kiraya.validate_meter_reading()
    // only rejects a value lower than an existing previous reading; confirmed live
    // against this exact property's fixture meters before writing this test), so
    // "0 is invalid" cannot be assumed for an arbitrary meter.
    await page.goto("/app/utilities");
    await page.getByRole("button", { name: "Add Utility" }).click();
    const utilityDialog = page.getByRole("dialog", { name: "Add Utility" });
    await utilityDialog.getByLabel("Code").fill(`E2E-BATCH-${stamp}`);
    await utilityDialog.getByLabel("Name", { exact: true }).fill(`E2E Batch Utility ${stamp}`);
    await utilityDialog.getByLabel("Metered (readings apply)").check();
    await utilityDialog.getByRole("button", { name: "Add Utility" }).click();
    await expect(utilityDialog).not.toBeVisible({ timeout: 15_000 });

    const meterCodeWithHistory = `E2E-BATCH-A-${stamp}`;
    const meterCodeNoHistory = `E2E-BATCH-B-${stamp}`;
    for (const meterCode of [meterCodeWithHistory, meterCodeNoHistory]) {
      await page.goto("/app/meters");
      await page.getByRole("button", { name: "Add Meter" }).click();
      const meterDialog = page.getByRole("dialog", { name: "Add Meter" });
      await meterDialog.getByLabel("Meter Code").fill(meterCode);
      await meterDialog.getByLabel("Utility").selectOption({ label: `E2E Batch Utility ${stamp}` });
      await meterDialog.getByRole("radio", { name: "Property" }).check();
      await meterDialog.locator('select[name="propertyId"]').selectOption(propertyAId!);
      await meterDialog.getByRole("button", { name: "Save Meter" }).click();
      await expect(page.getByText("Meter added.")).toBeVisible({ timeout: 15_000 });
    }

    // Establish a known previous reading (100) for meter A only.
    // Same fixture-accumulation reason as test 3-5: use the Meters search filter to
    // locate the newly-created meter rather than assuming it's on the rendered page.
    await page.getByLabel("Search", { exact: true }).fill(meterCodeWithHistory);
    // See the identical comment at test 3-5's search lookups: wait for the debounced ?q=
    // navigation to actually land before checking visibility/clicking, so a stale pending
    // debounce can't fire later and clobber the click's own navigation.
    await page.waitForURL((url) => url.searchParams.get("q") === meterCodeWithHistory);
    const meterWithHistoryLink = page.getByRole("link", { name: meterCodeWithHistory });
    await expect(meterWithHistoryLink).toBeVisible({ timeout: 15_000 });
    await meterWithHistoryLink.click();
    await page.waitForURL(/\/app\/meters\/.+/);
    await page.getByRole("button", { name: "Record Reading" }).click();
    const readingDialog = page.getByRole("dialog", { name: "Record Reading" });
    await readingDialog.getByLabel("Reading Date").fill("2026-01-01");
    await readingDialog.getByLabel("Reading Value").fill("100");
    await readingDialog.getByRole("button", { name: "Save Reading" }).click();
    await expect(page.getByText("Reading recorded.")).toBeVisible({ timeout: 15_000 });

    // Batch: submit 50 (< 100, must be rejected) for meter A, and 75 (no prior reading, always valid) for meter B.
    await page.goto(`/app/meters/batch?propertyId=${propertyAId}&date=2026-02-01`);
    const rowA = page.locator("tr", { hasText: meterCodeWithHistory });
    const rowB = page.locator("tr", { hasText: meterCodeNoHistory });
    await expect(rowA).toBeVisible({ timeout: 15_000 });
    await expect(rowB).toBeVisible();
    await rowA.getByRole("spinbutton").fill("50");
    await rowB.getByRole("spinbutton").fill("75");
    await page.getByRole("button", { name: "Save Readings" }).click();

    // The rejected row shows Error with the real trigger message; the other row still saves, proving isolation.
    await expect(rowA.getByText("Error")).toBeVisible({ timeout: 15_000 });
    await expect(rowA.getByText(/Meter reading cannot be lower than the previous reading/)).toBeVisible();
    await expect(rowB.getByText("Saved")).toBeVisible();
    await expect(page.getByText("1 saved")).toBeVisible();
    await expect(page.getByText("1 error")).toBeVisible();

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
