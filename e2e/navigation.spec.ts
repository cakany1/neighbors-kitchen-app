import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Neighbors Kitchen/);
  });

  test('story page loads and displays content', async ({ page }) => {
    await page.goto('/story');
    await expect(page.locator('h1')).toContainText(/Unsere Geschichte|Our Story/);
    await expect(page.getByText(/Made with/)).toBeVisible();
  });

  test('trust page loads with data residency info', async ({ page }) => {
    await page.goto('/trust');
    await expect(page.locator('h1')).toContainText('Trust & Safety');
    await expect(page.getByText('Datenstandort Schweiz')).toBeVisible();
    await expect(page.getByText('AWS Zürich')).toBeVisible();
  });

  test('partnerships page loads', async ({ page }) => {
    await page.goto('/partnerships');
    await expect(page.locator('h1')).toContainText(/Partnerschaften|Partnerships/);
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('Datenschutzerklärung');
  });

  test('FAQ page loads', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('h1')).toContainText(/FAQ|Häufige Fragen/);
  });

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1')).toContainText(/Kontakt|Contact/);
  });
});
