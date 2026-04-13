import { test, expect } from '@playwright/test';

test.describe('ENGIE Portal - Navigation', () => {
  test('loads dashboard by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ENGIE', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('DEMO')).toBeVisible();
  });

  test('shows user info in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header span').getByText('Marie Dupont')).toBeVisible();
  });

  test('navigates to contracts page', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').getByRole('link', { name: /contracts/i }).click();
    await expect(page).toHaveURL('/contracts');
    await expect(page.getByText('ENGIE-ELEC-2024-78542')).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to invoices page', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').getByRole('link', { name: /invoices/i }).click();
    await expect(page).toHaveURL('/invoices');
    await expect(page.getByText('FACT-2026').first()).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to consumption page', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').getByRole('link', { name: /consumption/i }).click();
    await expect(page).toHaveURL('/consumption');
  });

  test('navigates to profile page', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav ul').getByRole('link', { name: /profile/i }).click();
    await expect(page).toHaveURL('/profile');
    await expect(page.getByText('marie.dupont@engie.com')).toBeVisible();
  });
});

test.describe('ENGIE Portal - Dashboard', () => {
  test('displays contract overview widget', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ENGIE-ELEC-2024-78542')).toBeVisible({ timeout: 10_000 });
  });

  test('shows contract stats', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ENGIE-ELEC-2024-78542')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('4', { exact: true }).first()).toBeVisible();
  });

  test('displays quick actions', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByText('Actions rapides').or(page.getByText('Quick Actions')),
    ).toBeVisible();
  });
});

test.describe('ENGIE Portal - Contracts', () => {
  test('lists all contracts with details', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page.getByText('ENGIE-ELEC-2024-78542')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('ENGIE-GAZ-2024-32187')).toBeVisible();
    await expect(page.getByText('ENGIE-SOLAR-2025-10245')).toBeVisible();
  });

  test('shows contract status badges', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page.getByText('Actif').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('En attente')).toBeVisible();
    await expect(page.getByText('Résilié')).toBeVisible();
  });

  test('displays contract addresses', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page.getByText('15 Rue de la Paix').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('ENGIE Portal - Invoices', () => {
  test('lists invoices with amounts', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByText('FACT-2026').first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows invoice statuses', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByText('Payée').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('ENGIE Portal - Profile', () => {
  test('displays user profile', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('main').getByText('Marie Dupont').first()).toBeVisible();
    await expect(page.getByText('marie.dupont@engie.com')).toBeVisible();
  });

  test('shows language selector', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('combobox')).toBeVisible();
  });
});
