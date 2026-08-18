import { test, expect } from "@playwright/test";

test.describe("route protection (no session)", () => {
  test("unauthenticated visitor is redirected from /app/dashboard to /login", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated visitor is redirected from /admin/dashboard to /login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("root redirects to /login when signed out", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders the sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("KIRAYA")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});
