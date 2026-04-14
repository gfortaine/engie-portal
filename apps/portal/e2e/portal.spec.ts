import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel(/adresse e-mail|email address/i).fill('marie.dupont@engie.com');
  await page.locator('#login-password').fill('Gén!e-ENGIE_2026$');
  await page.getByRole('button', { name: /se connecter|sign in/i }).click();
  await expect(page.getByText(/demo|démo/i).first()).toBeVisible({ timeout: 10_000 });
}

test.describe('ENGIE Portal - Login', () => {
  test('shows login page on first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/espace client|customer portal/i)).toBeVisible();
    await expect(page.getByLabel(/adresse e-mail|email address/i)).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/adresse e-mail|email address/i).fill('bad@email.com');
    await page.locator('#login-password').fill('wrong');
    await page.getByRole('button', { name: /se connecter|sign in/i }).click();
    await expect(page.getByText(/identifiants incorrects|invalid credentials/i)).toBeVisible();
  });

  test('logs in with valid credentials', async ({ page }) => {
    await login(page);
    await expect(page.locator('header span').getByText('Marie Dupont')).toBeVisible();
  });

  test('session persists on page reload', async ({ page }) => {
    await login(page);
    await page.reload();
    await expect(page.getByText(/demo|démo/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/adresse e-mail|email address/i)).not.toBeVisible();
  });

  test('logout returns to login page', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: /déconnexion|sign out/i }).click();
    await expect(page.getByText(/espace client|customer portal/i)).toBeVisible();
  });
});

test.describe('ENGIE Portal - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('loads dashboard by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ENGIE', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/demo|démo/i).first()).toBeVisible();
  });

  test('shows user info in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header span').getByText('Marie Dupont')).toBeVisible();
  });

  test('navigates to contracts page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /contrats|contracts/i }).first().click();
    await expect(page).toHaveURL('/contracts');
    await expect(page.getByText('ENGIE-ELEC-2024-78542')).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to invoices page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /factures|invoices/i }).first().click();
    await expect(page).toHaveURL('/invoices');
    await expect(page.getByText('FACT-2026').first()).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to consumption page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /consommation|consumption/i }).first().click();
    await expect(page).toHaveURL('/consumption');
  });

  test('navigates to profile page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /profil|profile/i }).first().click();
    await expect(page).toHaveURL('/profile');
    await expect(page.getByText('marie.dupont@engie.com')).toBeVisible();
  });
});

test.describe('ENGIE Portal - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

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
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('lists all contracts with details', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page.getByText('ENGIE-ELEC-2024-78542')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('ENGIE-GAZ-2024-32187')).toBeVisible();
    await expect(page.getByText('ENGIE-SOLAR-2025-10245')).toBeVisible();
  });

  test('shows contract status badges', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page.getByText(/actif|active/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/en attente|pending/i).first()).toBeVisible();
    await expect(page.getByText(/résilié|terminated/i).first()).toBeVisible();
  });

  test('displays contract addresses', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page.getByText('15 Rue de la Paix').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('ENGIE Portal - Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('lists invoices with amounts', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByText('FACT-2026').first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows invoice statuses', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByText(/payée|paid/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('ENGIE Portal - Profile', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

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
