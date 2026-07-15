import { defineConfig, devices } from '@playwright/test';

/** Port that `vite preview` serves the built client on during E2E. */
const PREVIEW_PORT = 4173;

/**
 * End-to-end smoke configuration. The client is built and served by
 * `vite preview`; the API is mocked inside each test (see e2e/*.spec.ts), so no
 * Gemini, Firestore, or running server is required — the run is hermetic.
 */
export default defineConfig({
  testDir: './e2e',
  // Live-only specs run via playwright.live.config.ts against a deployed URL.
  testIgnore: '**/*.live.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PREVIEW_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build -w @stadiumiq/client && npm run preview -w @stadiumiq/client -- --port ${PREVIEW_PORT} --strictPort`,
    url: `http://localhost:${PREVIEW_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
