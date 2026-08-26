import { test, expect } from "@playwright/test";

/**
 * P6.3-D Part 1 — Property occupancy summary must agree with Unit-level
 * occupancy, both now derived from the same authoritative "has an ACTIVE
 * lease" check (kiraya.unit_is_assignable()'s predicate), never units.status.
 *
 * This drives the real /app/properties/[id] screen and cross-checks the
 * KPI tile counts against the Units tab table's own per-row Current Tenant
 * column — which was already ACTIVE-lease-derived before this checkpoint
 * (kiraya.getUnitCurrentLeasesByIds) — rather than asserting a hardcoded
 * number, so it stays correct regardless of how the seed data evolves.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (.env.local)
 * E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD  — a user in organization A
 * E2E_ORG_A_PROPERTY_ID                — a property in organization A with at least one unit
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const propertyId = process.env.E2E_ORG_A_PROPERTY_ID;

const hasCredentials = Boolean(orgAEmail && orgAPassword && propertyId);

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app\/dashboard/);
}

function tileValue(page: import("@playwright/test").Page, label: string) {
  return page.locator(`xpath=//div[normalize-space(text())='${label}']/following-sibling::div[1]`);
}

test.describe("Property occupancy summary", () => {
  test.skip(!hasCredentials, "Needs E2E_ORG_A_EMAIL/PASSWORD/PROPERTY_ID — not available in this environment.");

  test("Occupied/Vacant tile counts agree with the Units tab's own per-unit Current Tenant column", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    await page.goto(`/app/properties/${propertyId}`);

    const totalUnits = Number((await tileValue(page, "Total Units").innerText()).trim());
    const occupiedUnits = Number((await tileValue(page, "Occupied Units").innerText()).trim());
    const vacantUnits = Number((await tileValue(page, "Vacant Units").innerText()).trim());
    const occupancyText = (await tileValue(page, "Occupancy").innerText()).trim();

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBe(totalUnits);

    let occupiedFromTable = 0;
    let vacantFromTable = 0;
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const statusText = (await row.locator("td").nth(1).innerText()).trim();
      const tenantCellText = (await row.locator("td").nth(3).innerText()).trim();
      const isOccupied = tenantCellText !== "—";
      if (isOccupied) {
        occupiedFromTable += 1;
      } else if (statusText !== "Maintenance" && statusText !== "Unavailable") {
        vacantFromTable += 1;
      }
    }

    expect(occupiedUnits).toBe(occupiedFromTable);
    expect(vacantUnits).toBe(vacantFromTable);

    const expectedPercentage = totalUnits === 0 ? 0 : Math.round((occupiedUnits / totalUnits) * 10000) / 100;
    expect(occupancyText).toBe(`${expectedPercentage}%`);
  });
});
