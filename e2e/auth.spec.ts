import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Anmelden|Login|Willkommen/ })).toBeVisible();
    await expect(page.getByLabel(/E-Mail/i)).toBeVisible();
    await expect(page.getByLabel(/Passwort/i)).toBeVisible();
  });

  test('signup page loads correctly', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /Registrieren|Sign up|Konto erstellen/ })).toBeVisible();
  });

  test('login shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /Anmelden|Login|Sign in/i }).click();
    
    // Should show validation or stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/E-Mail/i).fill('invalid@test.com');
    await page.getByLabel(/Passwort/i).fill('wrongpassword123');
    await page.getByRole('button', { name: /Anmelden|Login|Sign in/i }).click();
    
    // Should show error message or toast
    await expect(page.getByText(/ungültig|invalid|fehler|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('can navigate from login to signup', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('link', { name: /Registrieren|Sign up|Konto erstellen/i }).click();
    
    await expect(page).toHaveURL(/signup/);
  });
});
