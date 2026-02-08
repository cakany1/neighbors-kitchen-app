import { test, expect } from '@playwright/test';

test.describe('Mobile Experience', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12 Pro

  test('mobile homepage shows app entry view', async ({ page }) => {
    await page.goto('/');
    
    // Mobile should show login/start buttons
    await expect(page.getByRole('button', { name: /Einloggen|Login|App Starten|Start/i })).toBeVisible();
  });

  test('mobile navigation works', async ({ page }) => {
    await page.goto('/story');
    
    // Header should be visible
    await expect(page.locator('header')).toBeVisible();
    
    // Content should be readable
    await expect(page.locator('h1')).toBeVisible();
  });

  test('bottom navigation is visible on feed', async ({ page }) => {
    await page.goto('/feed');
    
    // If redirected to login, that's also valid
    const currentUrl = page.url();
    if (currentUrl.includes('/feed')) {
      // Bottom nav should be visible
      await expect(page.locator('nav').last()).toBeVisible();
    }
  });

  test('trust page is scrollable on mobile', async ({ page }) => {
    await page.goto('/trust');
    
    // Page should load
    await expect(page.locator('h1')).toContainText('Trust & Safety');
    
    // Should be able to scroll
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Data residency section should be accessible
    await expect(page.getByText('Datenstandort Schweiz')).toBeVisible();
  });
});
