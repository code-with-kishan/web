import { defineConfig, devices } from '@playwright/test';

/**
 * Live end-to-end smoke against the deployed Cloud Run URL. Unlike the hermetic
 * local suite (playwright.config.ts), this hits the real backend, so it runs
 * only the read-only `*.live.spec.ts` checks. Provide the target via
 * `E2E_BASE_URL`; there is no local web server.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.live.spec.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
