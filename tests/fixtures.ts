// tests/fixtures.ts
import { test as base } from '@playwright/test';

export const test = base;
export const expect = test.expect;

test.afterEach(async ({ page }, testInfo) => {
  const failed = testInfo.status !== testInfo.expectedStatus;
  if (failed) {
    // ensure top of page and grab a **full-page** screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    const png = await page.screenshot({ fullPage: true });
    await testInfo.attach('fullpage-on-failure', { body: png, contentType: 'image/png' });
  }
});
