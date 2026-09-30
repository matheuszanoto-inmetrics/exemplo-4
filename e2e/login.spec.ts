import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const VALID_USER = { name: 'Teste QA', email: 'qa@bugbank.com', password: 'Senha@123' };

async function registerUser(page: Page, user = VALID_USER) {
  await page.goto(BASE_URL);
  await page.click('button:has-text("Registrar")');
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="passwordConfirmation"]', user.password);
  await page.click('button:has-text("Cadastrar")');
  await page.waitForTimeout(500);
}

async function clearStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

test.describe('Login - Test Plan 7540', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  // Caso 7542
  test('Login com credenciais válidas', async ({ page }) => {
    await registerUser(page);
    await page.goto(BASE_URL);

    await page.fill('input[name="email"]', VALID_USER.email);
    await page.fill('input[name="password"]', VALID_USER.password);
    await page.click('button:has-text("Acessar")');

    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('#textName')).toContainText(VALID_USER.name);
    await expect(page.locator('#textAccountNumber')).toBeVisible();
  });

  // Caso 7543
  test('Login com campos obrigatórios vazios', async ({ page }) => {
    await page.click('button:has-text("Acessar")');

    const modal = page.locator('[data-testid="modal"], .modal, [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toContainText('Usuário e senha precisam ser preenchidos');
  });

  // Caso 7544
  test('Login apenas com e-mail preenchido', async ({ page }) => {
    await page.fill('input[name="email"]', VALID_USER.email);
    await page.click('button:has-text("Acessar")');

    await expect(page.locator('.input__warning, [class*="warning"]').last()).toBeVisible();
    await expect(page.locator('.input__warning, [class*="warning"]').last()).toContainText('É campo obrigatório');
  });

  // Caso 7545
  test('Login apenas com senha preenchida', async ({ page }) => {
    await page.fill('input[name="password"]', VALID_USER.password);
    await page.click('button:has-text("Acessar")');

    await expect(page.locator('.input__warning, [class*="warning"]').first()).toBeVisible();
    await expect(page.locator('.input__warning, [class*="warning"]').first()).toContainText('É campo obrigatório');
  });

  // Caso 7546
  test('Login com usuário não cadastrado', async ({ page }) => {
    await page.fill('input[name="email"]', 'nao.cadastrado@teste.com');
    await page.fill('input[name="password"]', 'SenhaQualquer@1');
    await page.click('button:has-text("Acessar")');

    const modal = page.locator('[data-testid="modal"], .modal, [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toContainText('inválido');
  });

  // Caso 7547
  test('Login com senha incorreta', async ({ page }) => {
    await registerUser(page);
    await page.goto(BASE_URL);

    await page.fill('input[name="email"]', VALID_USER.email);
    await page.fill('input[name="password"]', 'SenhaErrada@999');
    await page.click('button:has-text("Acessar")');

    const modal = page.locator('[data-testid="modal"], .modal, [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toContainText('inválido');
  });

  // Caso 7548
  test('Login com campos contendo apenas espaços', async ({ page }) => {
    await page.fill('input[name="email"]', '   ');
    await page.fill('input[name="password"]', '   ');
    await page.click('button:has-text("Acessar")');

    await expect(page).toHaveURL(BASE_URL + '/');
  });

  // Caso 7549
  test('Login com e-mail em formato inválido', async ({ page }) => {
    await page.fill('input[name="email"]', 'usuario@');
    await page.fill('input[name="password"]', VALID_USER.password);
    await page.click('button:has-text("Acessar")');

    await expect(page.locator('.input__warning, [class*="warning"]').first()).toBeVisible();
    await expect(page.locator('.input__warning, [class*="warning"]').first()).toContainText('Formato inválido');
  });

  // Caso 7550
  test('Login após limpar localStorage', async ({ page }) => {
    await registerUser(page);
    await clearStorage(page);
    await page.reload();

    await page.fill('input[name="email"]', VALID_USER.email);
    await page.fill('input[name="password"]', VALID_USER.password);
    await page.click('button:has-text("Acessar")');

    const modal = page.locator('[data-testid="modal"], .modal, [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toContainText('inválido');
  });
});
