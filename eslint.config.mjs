import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "tests/e2e/**",
      "playwright-report/**",
      "test-results/**",
      "playwright.config.ts",
      // Vendor runtime shipped with the approved Claude Design exports —
      // visual reference only, not application source. See design/github.md.
      "design/**",
    ],
  },
];

export default eslintConfig;
