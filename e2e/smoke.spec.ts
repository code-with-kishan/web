import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';

// Hermetic end-to-end smoke tests: the API is mocked at the network boundary so
// the real built client is exercised without Gemini, Firestore, or a server.
// Every flow ends with an axe-core WCAG 2.1 A/AA scan of the rendered page.

async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

const OPS_SNAPSHOT = {
  zones: [
    {
      id: 'south-concourse',
      name: 'South Concourse',
      capacity: 6000,
      occupancy: 5300,
      densityPct: 88,
      status: 'critical',
    },
    {
      id: 'north-stand',
      name: 'North Stand',
      capacity: 18000,
      occupancy: 9900,
      densityPct: 55,
      status: 'comfortable',
    },
  ],
  incidents: [
    {
      id: 'inc-001',
      zoneId: 'south-concourse',
      category: 'crowd',
      severity: 'high',
      summary: 'Congestion at the South Concourse food court.',
      status: 'open',
      reportedAt: '2026-07-06T17:05:00.000Z',
    },
  ],
  sustainability: {
    wasteDivertedPct: 68,
    energyKwh: 41200,
    waterRefillCount: 5230,
    co2SavedKg: 1840,
  },
  generatedAt: '2026-07-06T17:10:00.000Z',
};

test('a fan asks the assistant and reads a grounded answer', async ({ page }) => {
  await page.route('**/api/assistant/ask', (route: Route) =>
    route.fulfill({
      json: { answer: 'Use Gate 6 for step-free access.', language: 'en', cached: false },
    }),
  );

  await page.goto('/');
  await page.getByRole('link', { name: 'Fan Assistant', exact: true }).click();
  await expect(page).toHaveURL(/\/assistant$/);

  await page.getByLabel('Your question').fill('Where is the accessible entrance?');
  await page.getByRole('button', { name: 'Ask StadiumIQ' }).click();

  await expect(page.getByText('Use Gate 6 for step-free access.')).toBeVisible();
  await expectNoA11yViolations(page);
});

test('the operations board renders live zones, incidents and sustainability', async ({ page }) => {
  await page.route('**/api/operations/snapshot', (route: Route) =>
    route.fulfill({ json: OPS_SNAPSHOT }),
  );

  await page.goto('/operations');

  await expect(page.getByRole('heading', { name: 'South Concourse' })).toBeVisible();
  await expect(page.getByText('Congestion at the South Concourse food court.')).toBeVisible();
  await expect(page.getByText('Waste diverted from landfill')).toBeVisible();
  await expectNoA11yViolations(page);
});

test('an Arabic answer renders right-to-left', async ({ page }) => {
  const arabicAnswer = 'استخدم البوابة 6 للوصول دون درجات.';
  await page.route('**/api/assistant/ask', (route: Route) =>
    route.fulfill({ json: { answer: arabicAnswer, language: 'ar', cached: false } }),
  );

  await page.goto('/assistant');
  await page.getByLabel('Answer language').selectOption('ar');
  await page.getByLabel('Your question').fill('أين المدخل المخصص لذوي الاحتياجات الخاصة؟');
  await page.getByRole('button', { name: 'Ask StadiumIQ' }).click();

  const answer = page.getByText(arabicAnswer);
  await expect(answer).toBeVisible();
  // dir="auto" must resolve Arabic content to a right-to-left reading order,
  // and lang must mark the content's language for screen readers (WCAG 3.1.2).
  await expect(answer).toHaveCSS('direction', 'rtl');
  await expect(answer).toHaveAttribute('lang', 'ar');
  await expectNoA11yViolations(page);
});

test('the home page passes an accessibility scan', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoA11yViolations(page);
});
