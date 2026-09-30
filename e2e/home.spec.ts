import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const USER = { name: 'QA Home', email: 'qa.home@bugbank.com', password: 'Senha@123' };

async function registerAndLogin(page: Page, withBalance = false) {
  await page.goto(BASE_URL);
  await page.click('button:has-text("Registrar")');
  await page.fill('input[name="name"]', USER.name);
  await page.fill('input[name="email"]', USER.email);
  await page.fill('input[name="password"]', USER.password);
  await page.fill('input[name="passwordConfirmation"]', USER.password);
  if (withBalance) {
    const toggle = page.locator('input[type="checkbox"], [role="switch"]');
    if (await toggle.isVisible()) await toggle.click();
  }
  await page.click('button:has-text("Cadastrar")');
  await page.waitForTimeout(500);

  await page.goto(BASE_URL);
  await page.fill('input[name="email"]', USER.email);
  await page.fill('input[name="password"]', USER.password);
  await page.click('button:has-text("Acessar")');
  await page.waitForURL(/\/home/);
}

test.describe('Home - Módulo de Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('Exibe saudação com nome do usuário após login', async ({ page }) => {
    await registerAndLogin(page);

    await expect(page.locator('#textName')).toContainText(`Olá ${USER.name}`);
  });

  test('Exibe número da conta digital', async ({ page }) => {
    await registerAndLogin(page);

    await expect(page.locator('#textAccountNumber')).toBeVisible();
    await expect(page.locator('#textAccountNumber')).toContainText('Conta digital:');
  });

  test('Exibe saldo em conta', async ({ page }) => {
    await registerAndLogin(page);

    await expect(page.locator('#textBalance')).toBeVisible();
    await expect(page.locator('#textBalance')).toContainText('Saldo em conta');
  });

  test('Botão Transferência navega para /transfer', async ({ page }) => {
    await registerAndLogin(page);

    await page.click('#btn-TRANSFERÊNCIA');
    await expect(page).toHaveURL(/\/transfer/);
  });

  test('Botão Extrato navega para /bank-statement', async ({ page }) => {
    await registerAndLogin(page);

    await page.click('#btn-EXTRATO');
    await expect(page).toHaveURL(/\/bank-statement/);
  });

  test('Botão Pagamentos exibe modal de funcionalidade em desenvolvimento', async ({ page }) => {
    await registerAndLogin(page);

    await page.click('#btn-PAGAMENTOS');
    await expect(page.locator('[role="dialog"], .modal, [class*="modal"]')).toContainText(
      'Funcionalidade em desenvolvimento',
    );
  });

  test('Botão Saque exibe modal de funcionalidade em desenvolvimento', async ({ page }) => {
    await registerAndLogin(page);

    await page.click('#btn-SAQUE');
    await expect(page.locator('[role="dialog"], .modal, [class*="modal"]')).toContainText(
      'Funcionalidade em desenvolvimento',
    );
  });

  test('Logout redireciona para a página inicial', async ({ page }) => {
    await registerAndLogin(page);

    await page.click('#btnExit');
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('Acesso direto à home sem cookie redireciona para login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/home`);

    await expect(page).toHaveURL(BASE_URL + '/');
  });
});
