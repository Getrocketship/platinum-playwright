import { defineConfig, devices } from '@playwright/test';

const VIEWPORT = { width: 1280, height: 900 };

export default defineConfig({
  testDir: './tests',
  retries: 1,
  use: {
    headless: true,
    baseURL: 'https://platinumedge.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['./reporters/mailgun-reporter.ts'], // optional if you want the immediate email too
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: VIEWPORT } },
  ],
});
