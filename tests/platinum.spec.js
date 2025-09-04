// @ts-check
import { test, expect } from '@playwright/test';


// Small helper to attach a full-page screenshot to the report
async function shot(page, name) {
  const png = await page.screenshot({ fullPage: true });
  await test.info().attach(name, { body: png, contentType: 'image/png' });
}

async function closeConsentIfAny(page) {
  const candidates = [
    page.getByRole('button', { name: /accept|agree|got it|allow|ok|continue|i understand/i }),
    page.locator('[aria-label="Close"]'),
    page.locator('.close, .mfp-close, .cc-dismiss, .cookie-accept, .cookie'),
  ];
  for (const btn of candidates) {
    const el = btn.first();
    if (await el.isVisible().catch(() => false)) {
      await el.click().catch(() => {});
      break;
    }
  }
}


async function atfScreenshot(page, browserName, slug) {
  // stabilize the viewport area (“above the fold”)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(async () => { try { await document.fonts?.ready; } catch {} });
  await expect(page).toHaveScreenshot(`${slug}-atf.png`);
}

async function runPageCheck(page, browserName, { url, titleRe, slug }) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await shot(page, `${slug}-before`);

  expect(response?.status(), 'HTTP status should be >= 200').toBeGreaterThanOrEqual(200);
  expect(response?.status(), 'HTTP status should be < 300').toBeLessThan(300);
  await expect(page).toHaveTitle(titleRe);

  // close cookie/consent if it appears (no masking, we just remove it)
  await closeConsentIfAny(page);

  // Above-the-fold visual regression (no masks, viewport only)
  await atfScreenshot(page, browserName, slug);

  await shot(page, `${slug}-after`);
}

/* ------------------------- test matrix ------------------------- */
const pages = [
  { name: 'Platinum Edge site is reachable', url: 'https://platinumedge.com/', titleRe: /Platinum Edge/i, slug: 'home' },
  { name: 'Platinum Edge - CSM is reachable', url: 'https://platinumedge.com/event-type/certified-scrummaster-csm', titleRe: /Certified ScrumMaster/i, slug: 'csm' },
  { name: 'Platinum Edge - CSPO is reachable', url: 'https://platinumedge.com/event-type/certified-scrum-product-owner-cspo', titleRe: /Certified Scrum Product Owner/i, slug: 'cspo' },
  { name: 'Platinum Edge - ACSM is reachable', url: 'https://platinumedge.com/event-type/advanced-certified-scrummaster-a-csm', titleRe: /Advanced ScrumMaster/i, slug: 'acsm' },
  { name: 'Platinum Edge - Certified Agile Leadership 1 is reachable', url: 'https://platinumedge.com/event-type/certified-agile-leadership-1-cal-1', titleRe: /Certified Agile Leadership/i, slug: 'cal1' },
  { name: 'Platinum Edge - Certified Scrum Developer is reachable', url: 'https://platinumedge.com/event-type/certified-scrum-developer-csd', titleRe: /Certified Scrum Developer/i, slug: 'csd' },
  { name: 'Platinum Edge - Jira Fundamentals Training is reachable', url: 'https://platinumedge.com/event-type/jira-complete-fundamentals-parts-1-2', titleRe: /Jira Fundamentals Training/i, slug: 'jira' },
  { name: 'Platinum Edge - Disciplined Agile is reachable', url: 'https://platinumedge.com/event-type/disciplined-agile-scrum-master-dasm', titleRe: /Disciplined Agile/i, slug: 'dasm' },
  { name: 'Platinum Edge - Psychological Safety is reachable', url: 'https://platinumedge.com/event-type/psychological-safety', titleRe: /Psychological Safety/i, slug: 'psych-safety' },
  { name: 'Platinum Edge - Change Management Training is reachable', url: 'https://platinumedge.com/event-type/organizational-change-management', titleRe: /Change Management Training/i, slug: 'change-mgmt' },
  { name: 'Platinum Edge - Agile Training for Government is reachable', url: 'https://platinumedge.com/certified-agile-training-for-government', titleRe: /Agile Training for Government/i, slug: 'gov' },
  { name: 'Platinum Edge - Scrum Training for U.S. Army is reachable', url: 'https://platinumedge.com/certified-scrum-training-for-us-army', titleRe: /Scrum Training for U\.S\. Army/i, slug: 'us-army' },
  { name: 'Platinum Edge - Scrum Training for Veterans is reachable', url: 'https://platinumedge.com/give-back-certified-scrum-training-for-veterans', titleRe: /Scrum Training for Veterans/i, slug: 'for-veterans' },
];

for (const p of pages) {
  test(p.name, async ({ page, browserName }) => {
    await runPageCheck(page, browserName, p);
  });
}