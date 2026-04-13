import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Skip webServer when using an external server (PW_BASE_URL)
  ...(process.env.PW_BASE_URL
    ? {}
    : {
        webServer: [
          {
            command: 'pnpm --filter @engie-portal/bff dev',
            port: 4000,
            reuseExistingServer: !process.env.CI,
            timeout: 10_000,
          },
          {
            command: 'pnpm --filter @engie-portal/portal dev',
            port: 3000,
            reuseExistingServer: !process.env.CI,
            timeout: 10_000,
          },
        ],
      }),
});
