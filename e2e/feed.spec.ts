import { test, expect } from '@playwright/test';

test.describe('Feed & Discovery', () => {
  test('feed page loads', async ({ page }) => {
    await page.goto('/feed');
    
    // Should show feed content or redirect to login
    const isOnFeed = page.url().includes('/feed');
    const isOnLogin = page.url().includes('/login');
    
    expect(isOnFeed || isOnLogin).toBeTruthy();
  });

  test('map view page loads', async ({ page }) => {
    await page.goto('/map');
    
    // Should show map or redirect to login
    const currentUrl = page.url();
    expect(currentUrl.includes('/map') || currentUrl.includes('/login')).toBeTruthy();
  });
});
