import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Next.js's own webServer process (npm run build && npm run start, below)
// already loads .env.local automatically -- Next.js does this natively.
// The Playwright test runner is a separate Node process and does not; this
// is the same loader Next.js itself uses, so it resolves .env.local (and
// the same .env/.env.development/.env.production precedence Next.js
// applies) identically for both processes. It only fills in variables not
// already set, so anything the shell or CI already provides in
// process.env takes precedence, unchanged.
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
