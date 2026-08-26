import { test, expect } from "@playwright/test";
import { findOrgATenantIdWithExit } from "./helpers/fixtures";

/**
 * P5.4F Tenant Exits list — org-wide `/app/exits` read/navigation surface,
 * mirroring the established pattern (tenant-lease-isolation.spec.ts,
 * tenant-exit-wizard.spec.ts): logs in with a real session and drives the
 * actual screens, not a mocked component.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD          — a user in organization A
 * E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD          — a user in a *different*
 *                                                 organization B
 * E2E_ORG_A_READONLY_EMAIL, E2E_ORG_A_READONLY_PASSWORD — optional: a
 *                                                 viewer-only user in org A,
 *                                                 for the "New Exit" hidden-
 *                                                 for-viewers test
 *
 * The two exit-list tests use E2E_ORG_A_EXIT_TENANT_ID (a tenant in org A
 * with at least one tenant_exits row — the same fixture used by
 * tenant-exit-wizard.spec.ts) if set, otherwise (P5.14) dynamically
 * discover a tenant with an existing tenant_exits row via
 * helpers/fixtures.ts, using the same authenticated org-A session. If none
 * exists, they skip themselves at runtime.
 *
 * This test intentionally does not seed data itself — it observes the real
 * UI against real rows, not a mocked stand-in.
 *
 * P5.24 adds the "New Exit" entry-point test, which deliberately relies on
 * whatever ACTIVE, not-already-exiting leases already exist in org A's seed
 * data (rather than a dedicated fixture id) so it doesn't compete with
 * tenant-exit-wizard.spec.ts's own dedicated exit fixture for the same lease
 * under fullyParallel:true.
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;
const readOnlyEmail = process.env.E2E_ORG_A_READONLY_EMAIL;
const readOnlyPassword = process.env.E2E_ORG_A_READONLY_PASSWORD;

const hasCredentials = Boolean(orgAEmail && orgAPassword && orgBEmail && orgBPassword);
const hasReadOnlyCredentials = Boolean(readOnlyEmail && readOnlyPassword);

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

test.describe("Tenant Exits list", () => {
  test.skip(!hasCredentials, "Needs E2E_ORG_A_EMAIL/PASSWORD and E2E_ORG_B_EMAIL/PASSWORD — not available in this environment.");

  test("org A can load /app/exits", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto("/app/exits");
    // exact:true disambiguates from the Topbar's global search input, whose accessible
    // name ("Search tenants, bills, units…") otherwise matches "Search" as a substring.
    await expect(page.getByLabel("Search", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Status")).toBeVisible();
    await signOut(page);
  });

  test("empty state renders when filters match nothing", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto("/app/exits?q=NO-SUCH-EXIT-REFERENCE-XYZ");
    await expect(page.getByText("No tenant exits match your filters")).toBeVisible();
    await signOut(page);
  });

  test("org A sees its own exit, and the row links into the existing wizard", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const exitTenantId = process.env.E2E_ORG_A_EXIT_TENANT_ID ?? (await findOrgATenantIdWithExit(page));
    test.skip(!exitTenantId, "No tenant with a tenant_exits row currently exists for org A to use as a dynamic fixture.");

    // Discover the exit's own reference from the tenant's Exit tab, then confirm the org-wide list surfaces the same exit.
    await page.goto(`/app/tenants/${exitTenantId}`);
    await page.getByRole("tab", { name: "Exit" }).click();
    const hasExit = await page
      .getByRole("link", { name: /View Exit|Continue Exit/ })
      .isVisible()
      .catch(() => false);
    test.skip(!hasExit, "This tenant has no tenant_exits row yet — run the wizard fixture first.");

    const exitReference = await page.locator("text=/^EXIT-/").first().textContent();
    expect(exitReference).toBeTruthy();

    await page.goto("/app/exits");
    await expect(page.getByRole("link", { name: exitReference!.trim() })).toBeVisible();

    // Clicking the row's reference link lands inside the existing wizard shell, unaffected by this checkpoint.
    await page.getByRole("link", { name: exitReference!.trim() }).click();
    await page.waitForURL(/\/app\/exits\/.+\/(review|dues|deposit|adjustments|settlement|statement|refund|completion)/);
    // .first(): the reference legitimately renders twice on this page (the
    // step-rail heading and the breadcrumb trail), same ambiguity already
    // handled the same way for the /^EXIT-/ locator above.
    await expect(page.getByText(exitReference!.trim()).first()).toBeVisible();

    await signOut(page);
  });

  test("org B cannot see org A's exit in the list", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const exitTenantId = process.env.E2E_ORG_A_EXIT_TENANT_ID ?? (await findOrgATenantIdWithExit(page));
    test.skip(!exitTenantId, "No tenant with a tenant_exits row currently exists for org A to use as a dynamic fixture.");

    await page.goto(`/app/tenants/${exitTenantId}`);
    await page.getByRole("tab", { name: "Exit" }).click();
    const hasExit = await page
      .getByRole("link", { name: /View Exit|Continue Exit/ })
      .isVisible()
      .catch(() => false);
    test.skip(!hasExit, "This tenant has no tenant_exits row yet — run the wizard fixture first.");

    const exitReference = (await page.locator("text=/^EXIT-/").first().textContent())!.trim();
    const exitHref = await page.getByRole("link", { name: /View Exit|Continue Exit/ }).getAttribute("href");
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);

    // Org A's exit id, requested directly, is a clean not-found for org B.
    await page.goto(exitHref!);
    await expect(page.getByText("Page not found")).toBeVisible();

    // Org A's exit reference never appears anywhere in org B's full, unfiltered list.
    await page.goto("/app/exits");
    await expect(page.getByRole("link", { name: exitReference })).not.toBeVisible();
    await signOut(page);
  });

  test("read-only user does not see the New Exit action", async ({ page }) => {
    test.skip(!hasReadOnlyCredentials, "Needs E2E_ORG_A_READONLY_EMAIL/PASSWORD — a viewer-only user in org A.");
    await login(page, readOnlyEmail!, readOnlyPassword!);
    await page.goto("/app/exits");
    await expect(page.getByRole("button", { name: "New Exit" })).not.toBeVisible();
    await signOut(page);
  });

  test("New Exit opens a tenant/lease picker that leads into the existing wizard entry point", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto("/app/exits");
    // Wait for the page's own content before checking the (permission-gated,
    // hence possibly absent) New Exit button — an immediate isVisible() read
    // right after goto() can race the initial render and false-skip.
    await expect(page.getByLabel("Status")).toBeVisible();

    const newExitButton = page.getByRole("button", { name: "New Exit" });
    test.skip(!(await newExitButton.isVisible().catch(() => false)), "Signed-in org A user has no write access here.");
    await newExitButton.click();

    const picker = page.getByRole("dialog", { name: "Start a Tenant Exit" });
    await expect(picker).toBeVisible();

    const noEligible = await picker.getByText("No eligible tenants").isVisible().catch(() => false);
    test.skip(noEligible, "Org A currently has no ACTIVE lease without an exit already in progress.");

    // An unmatchable search proves the picker filters, without depending on
    // any specific tenant/lease fixture (several other specs create and
    // consume exits against org A's shared seed leases).
    await picker.getByLabel("Search tenant, property, or unit").fill("zzz-no-such-tenant-zzz");
    await expect(picker.getByText("No matches")).toBeVisible();
    await picker.getByLabel("Search tenant, property, or unit").fill("");

    const firstRow = picker.locator("table tbody tr").first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Lands on the existing, unmodified /app/exits/new?leaseId=... entry
    // point — the same one TenantExitTab's "Start Tenant Exit" link already
    // uses. Deliberately does not fill in or submit the form: this test
    // only proves the missing entry point now exists, not another pass
    // through the already-covered full wizard walkthrough.
    await page.waitForURL(/\/app\/exits\/new\?leaseId=.+/);
    await expect(page.getByLabel("Planned Exit Date")).toBeVisible();

    await signOut(page);
  });
});
