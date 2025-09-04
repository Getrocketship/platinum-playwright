import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: 1,
    use: {
        headless: true,
        baseURL: 'https://platinumedge.com',
        screenshot: 'off',            // <-- we'll attach our own full-page on failure
        video: 'on',
        trace: 'on-first-retry',
        viewport: { width: 1440, height: 900 },
        timezoneId: 'UTC',
        locale: 'en-US',
        colorScheme: 'light',
    },
  expect: {
    timeout: 10000,
    snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}{ext}',
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.199
    }
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['./reporters/mailgun-reporter.ts'], // optional if you want the immediate email too
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
