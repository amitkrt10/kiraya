import { test, expect } from "@playwright/test";

/**
 * P5.25 Responsive/mobile shell — a real 375x812 viewport (not CSS
 * simulation: Playwright's actual browser viewport, set via test.use()
 * below), driving the real screens with a real session, mirroring the
 * established pattern (tenant-exits-list.spec.ts etc.).
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD — a user in organization A
 *
 * The New Exit flow deliberately mirrors tenant-exits-list.spec.ts's own
 * P5.24 test: it uses whatever ACTIVE, not-already-exiting lease is first
 * in the picker rather than a specific fixture id, so it doesn't compete
 * with other specs' dedicated exit fixtures under fullyParallel:true. It
 * stops once the existing wizard's first step renders — it does not
 * submit/initiate an exit, matching every other read-only assertion in
 * this file.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const hasCredentials = Boolean(orgAEmail && orgAPassword);

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app\/dashboard/);
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });
  expect(hasHorizontalOverflow).toBe(false);
}

test.describe("Mobile shell — 375x812", () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test.skip(!hasCredentials, "Needs E2E_ORG_A_EMAIL/PASSWORD — not available in this environment.");

  test("login, mobile menu, core navigation, and the Tenant Exits flow all work with no horizontal overflow", async ({ page }) => {
    test.setTimeout(60_000);

    // 1-2. Login, dashboard loads. expectNoHorizontalOverflow is the real
    // proof the off-canvas sidebar isn't occupying layout space at this
    // width (it's `position: fixed`, translated off-screen, so it never
    // contributes to document width) — checked on every step below.
    await login(page, orgAEmail!, orgAPassword!);
    // login() already waits for the /app/dashboard URL; this confirms real
    // dashboard content actually rendered (unique text, unlike "Dashboard"
    // itself, which also appears in the sidebar nav link and the breadcrumb).
    await expect(page.getByText("Collection Performance")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // 3. Mobile menu opens. P5.26 removed the standalone "Units" and
    // "Owners" nav items (their routes are placeholders, not full features)
    // — confirm they're gone from the drawer, and that the remaining
    // primary items are still present.
    const menuButton = page.getByRole("button", { name: "Open menu" });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.getByRole("link", { name: "Properties" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tenants" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tenant Exits" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Units", exact: true })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Owners", exact: true })).not.toBeVisible();
    await expectNoHorizontalOverflow(page);

    // 4. Navigate to Tenants — also proves the menu closes after navigation.
    await page.getByRole("link", { name: "Tenants" }).click();
    await page.waitForURL(/\/app\/tenants/);
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expectNoHorizontalOverflow(page);

    // 5. Navigate to Properties.
    await menuButton.click();
    await page.getByRole("link", { name: "Properties" }).click();
    await page.waitForURL(/\/app\/properties/);
    await expectNoHorizontalOverflow(page);

    // 6. Navigate to /app/exits.
    await menuButton.click();
    await page.getByRole("link", { name: "Tenant Exits" }).click();
    await page.waitForURL(/\/app\/exits/);
    // Wait for real page content before checking the (permission-gated,
    // hence possibly absent) New Exit button below — an immediate
    // isVisible() read right after navigation can race the initial render
    // and false-skip (proven loaded by page-title text, which — like
    // "Dashboard" above — also appears in the breadcrumb, so scoped here).
    await expect(page.getByLabel("Status")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // 7. New Exit is visible for a writer.
    const newExitButton = page.getByRole("button", { name: "New Exit" });
    test.skip(!(await newExitButton.isVisible().catch(() => false)), "Signed-in org A user has no write access here.");

    // 8. Exit filters remain usable (present, not clipped off past the
    // viewport). exact:true throughout — the closed New Exit picker's own
    // (unrelated) search input is labeled "Search tenant, property, unit,
    // or lease", which non-exact matching would also catch.
    await expect(page.getByLabel("Search", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Property", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Unit", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Tenant", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Status", { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // 9. Open New Exit.
    await newExitButton.click();
    const picker = page.getByRole("dialog", { name: "Start a Tenant Exit" });
    await expect(picker).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const noEligible = await picker.getByText("No eligible tenants").isVisible().catch(() => false);
    test.skip(noEligible, "Org A currently has no ACTIVE lease without an exit already in progress.");

    // 10. Select a lease.
    const firstRow = picker.locator("table tbody tr").first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // 11. Existing exit wizard opens (its own step-rail + first step form).
    await page.waitForURL(/\/app\/exits\/new\?leaseId=.+/);
    await expect(page.getByRole("heading", { name: "Start Tenant Exit" })).toBeVisible();
    await expect(page.getByLabel("Notice Date")).toBeVisible();
    await expect(page.getByLabel("Planned Exit Date")).toBeVisible();

    // 12. No horizontal page overflow, on the wizard's own two-region layout.
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("Desktop smoke — regression guard", () => {
  test.skip(!hasCredentials, "Needs E2E_ORG_A_EMAIL/PASSWORD — not available in this environment.");

  test("the persistent sidebar and topbar search remain exactly as before at desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page, orgAEmail!, orgAPassword!);

    // The off-canvas-only mobile menu button must not appear at all at
    // desktop width — the original persistent sidebar takes its place.
    await expect(page.getByRole("button", { name: "Open menu" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Properties" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tenants" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tenant Exits" })).toBeVisible();
    // P5.26 — "Units" and "Owners" removed from the primary sidebar too.
    await expect(page.getByRole("link", { name: "Units", exact: true })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Owners", exact: true })).not.toBeVisible();
    await expect(page.getByPlaceholder("Search tenants, bills, units…")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
