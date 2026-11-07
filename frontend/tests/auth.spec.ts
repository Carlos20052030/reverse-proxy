import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('Login with invalid credentials shows error toast', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in email and password with dummy data
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click the login button
    await page.click('button[type="submit"]');

    // Expect error toast "E-mail ou senha incorretos"
    await expect(page.getByText('E-mail ou senha incorretos')).toBeVisible();
  });

  test('Forgot password shows success toast', async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('/forgot-password');

    // Fill in the email
    await page.fill('input[type="email"]', 'test@example.com');

    // Click the send recovery link button
    await page.click('button[type="submit"]');

    // Expect success toast "Se o e-mail existir, um link foi enviado."
    await expect(page.getByText('Se o e-mail existir, um link foi enviado.')).toBeVisible();
  });
});