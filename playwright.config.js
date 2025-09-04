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
  expect: {
    timeout: 10000,
    // 👇 This controls BOTH toMatchSnapshot & toHaveScreenshot filenames.
    // Removes OS / project suffixes entirely.
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
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: VIEWPORT } },
  ],
});
