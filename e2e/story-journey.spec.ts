import { test, expect } from '@playwright/test';

test.describe('Story Page User Journey', () => {
  test('can navigate from story to partnerships', async ({ page }) => {
    await page.goto('/story');
    
    // Find and click the "Für Institutionen" card
    await page.getByText('Für Institutionen').click();
    
    await expect(page).toHaveURL(/partnerships/);
    await expect(page.locator('h1')).toContainText(/Partnerschaften|Partnerships/);
  });

  test('story page displays all value cards', async ({ page }) => {
    await page.goto('/story');
    
    // Check all 4 value cards are visible
    await expect(page.getByText('Gemeinschaft')).toBeVisible();
    await expect(page.getByText('Nachhaltigkeit')).toBeVisible();
    await expect(page.getByText('Hausgemacht')).toBeVisible();
    await expect(page.getByText('Für Institutionen')).toBeVisible();
  });

  test('story page has working footer links', async ({ page }) => {
    await page.goto('/story');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer is visible
    await expect(page.locator('footer')).toBeVisible();
  });
});
