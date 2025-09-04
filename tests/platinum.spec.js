// @ts-check
import { test, expect } from './fixtures';


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
  await expect(page).toHaveScreenshot(`${slug}-atf.png`, {
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
    maxDiffPixelRatio: 0.199,
  });
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

test('Platinum Edge - Add event to cart', async ({ page }) => {
    // 1) Land on CSM listing and drill into a registerable item if needed
    await page.goto('https://platinumedge.com/event-type/certified-scrummaster-csm', { waitUntil: 'domcontentloaded' });
    await closeConsentIfAny(page);

    // If a register link is present, click it to reach the product page that has the add-to-cart button.
    const registerLink = page.locator('a.anch-register-tbl').first();
    if (await registerLink.isVisible().catch(() => false)) {
        await Promise.all([
        registerLink.click(),
        page.waitForLoadState('domcontentloaded').catch(() => {}),
        ]);
    }

    // 2) Add to cart, expect auto-redirect to /cart
    const addToCart = page.locator('button.single_add_to_cart_button').first();
    await expect(addToCart, 'Add to cart button should be visible').toBeVisible({ timeout: 20_000 });

    await Promise.all([
        page.waitForURL(/\/cart(\/|$)/, { timeout: 20_000 }),
        addToCart.click(),
    ]);

    // 3) On Cart, click “Next page” to reach the intermediary info page
    const nextPageCta = page.getByRole('button', { name: /next page/i })
        .or(page.getByRole('link', { name: /next page/i }));
    await expect(nextPageCta, 'Cart should show “Next page”').toBeVisible({ timeout: 15_000 });

    await Promise.all([
        nextPageCta.first().click(),
        page.waitForLoadState('domcontentloaded').catch(() => {}),
    ]);

    // 4) Fill intermediary form (your selectors)
    await page.waitForSelector('#addcartdataform', { state: 'visible', timeout: 20_000 });
    const form = page.locator('#addcartdataform');

    await form.locator('.form-group-email input').fill('development@getrocketship.com');
    await form.locator('.form-group-fname input').fill('Play');
    await form.locator('.form-group-lname input').fill('Wright');
    await form.locator('.form-group-company input').fill('GetRocketship');
    await form.locator('.form-group-position input').fill('dev');
    await form.locator('.form-group-phone input').fill('11111');

  // Consent checkbox (click or check, depending on markup)
    const consent = form.locator('.form-group-consent input').first();
    if (await consent.isVisible().catch(() => false)) {
        // Prefer .check() if it's a checkbox; fallback to click if not
        await consent.check({ force: true }).catch(async () => {
        await consent.click({ force: true });
        });
    }

    // 5) Submit to review
    const reviewBtn = form.locator('#submit-to-review-btn').first();
    await expect(reviewBtn, 'Submit-to-review button should be enabled').toBeEnabled({ timeout: 10_000 });
    await Promise.all([
        reviewBtn.click(),
        page.waitForLoadState('domcontentloaded').catch(() => {}),
    ]);

    // 6) Assert we’re on the review step and place-order exists
    await expect(
        page.locator('button[name="woocommerce_checkout_place_order"]').first(),
        'Review step should show the final place order button'
    ).toBeVisible({ timeout: 15_000 });
});