import { expect, test } from '@playwright/test';

// Live smoke against the deployed Cloud Run URL (E2E_BASE_URL). Unlike the
// hermetic local suite, this hits the real backend, so it stays read-only and
// deterministic — it never submits a question, so it does not depend on a live
// Gemini call. Run after each deploy:
//   E2E_BASE_URL=<url> npm run test:e2e:live

test('home page and primary navigation render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Fan Assistant', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Operations', exact: true })).toBeVisible();
});

test('the assistant route loads its question form', async ({ page }) => {
  await page.goto('/assistant');
  await expect(page.getByLabel('Your question')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ask StadiumIQ' })).toBeVisible();
});

test('health and security.txt endpoints respond on the live host', async ({ request }) => {
  const health = await request.get('/api/health');
  expect(health.ok()).toBeTruthy();
  expect(((await health.json()) as { status: string }).status).toBe('ok');

  const securityTxt = await request.get('/.well-known/security.txt');
  expect(securityTxt.ok()).toBeTruthy();
  expect(await securityTxt.text()).toContain('Contact:');
});
