import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const SENDER = { name: 'Remetente QA', email: 'sender@bugbank.com', password: 'Senha@123' };
const RECEIVER = { name: 'Destinatario QA', email: 'receiver@bugbank.com', password: 'Senha@456' };

async function registerUser(page: Page, user: typeof SENDER, withBalance = false) {
  await page.goto(BASE_URL);
  await page.click('button:has-text("Registrar")');
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="passwordConfirmation"]', user.password);
  if (withBalance) {
    const toggle = page.locator('input[type="checkbox"], [role="switch"]');
    if (await toggle.isVisible()) await toggle.click();
  }
  await page.click('button:has-text("Cadastrar")');
  await page.waitForTimeout(500);
}

async function loginUser(page: Page, user: typeof SENDER) {
  await page.goto(BASE_URL);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button:has-text("Acessar")');
  await page.waitForURL(/\/home/);
}

async function getAccountNumber(page: Page, user: typeof SENDER): Promise<{ number: string; digit: string }> {
  const raw = await page.evaluate((email) => {
    const stored = localStorage.getItem(email);
    return stored ? JSON.parse(stored).accountNumber : '';
  }, user.email);
  const [number, digit] = raw.split('-');
  return { number, digit };
}

test.describe('Transfer - Módulo de Transferência', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('Transferência bem-sucedida entre contas', async ({ page }) => {
    await registerUser(page, RECEIVER);
    await loginUser(page, RECEIVER);
    const receiverAccount = await getAccountNumber(page, RECEIVER);

    await registerUser(page, SENDER, true);
    await loginUser(page, SENDER);

    await page.click('#btn-TRANSFERÊNCIA');
    await page.fill('input[name="accountNumber"]', receiverAccount.number);
    await page.fill('input[name="digit"]', receiverAccount.digit);
    await page.fill('input[name="transferValue"]', '100');
    await page.fill('input[name="description"]', 'Transferência de teste');
    await page.click('#btnTransferNow');

    await expect(page.locator('[role="dialog"], .modal, [class*="modal"]')).toContainText(
      'sucesso',
    );
  });

  test('Transferência com conta inválida exibe erro', async ({ page }) => {
    await registerUser(page, SENDER, true);
    await loginUser(page, SENDER);

    await page.click('#btn-TRANSFERÊNCIA');
    await page.fill('input[name="accountNumber"]', '9999');
    await page.fill('input[name="digit"]', '9');
    await page.fill('input[name="transferValue"]', '50');
    await page.fill('input[name="description"]', 'Conta invalida');
    await page.click('#btnTransferNow');

    await expect(page.locator('[role="dialog"], .modal, [class*="modal"]')).toContainText(
      'Conta inválida ou inexistente',
    );
  });

  test('Transferência com saldo insuficiente exibe erro', async ({ page }) => {
    await registerUser(page, RECEIVER);
    await loginUser(page, RECEIVER);
    const receiverAccount = await getAccountNumber(page, RECEIVER);

    await registerUser(page, SENDER);
    await loginUser(page, SENDER);

    await page.click('#btn-TRANSFERÊNCIA');
    await page.fill('input[name="accountNumber"]', receiverAccount.number);
    await page.fill('input[name="digit"]', receiverAccount.digit);
    await page.fill('input[name="transferValue"]', '9999');
    await page.fill('input[name="description"]', 'Saldo insuficiente');
    await page.click('#btnTransferNow');

    await expect(page.locator('[role="dialog"], .modal, [class*="modal"]')).toContainText(
      'saldo suficiente',
    );
  });

  test('Transferência com valor zero exibe erro', async ({ page }) => {
    await registerUser(page, RECEIVER);
    await loginUser(page, RECEIVER);
    const receiverAccount = await getAccountNumber(page, RECEIVER);

    await registerUser(page, SENDER, true);
    await loginUser(page, SENDER);

    await page.click('#btn-TRANSFERÊNCIA');
    await page.fill('input[name="accountNumber"]', receiverAccount.number);
    await page.fill('input[name="digit"]', receiverAccount.digit);
    await page.fill('input[name="transferValue"]', '0');
    await page.fill('input[name="description"]', 'Valor zero');
    await page.click('#btnTransferNow');

    await expect(page.locator('[role="dialog"], .modal, [class*="modal"]')).toContainText(
      'não pode ser 0',
    );
  });

  test('Transferência para a própria conta exibe erro', async ({ page }) => {
    await registerUser(page, SENDER, true);
    await loginUser(page, SENDER);
    const senderAccount = await getAccountNumber(page, SENDER);

    await page.click('#btn-TRANSFERÊNCIA');
    await page.fill('input[name="accountNumber"]', senderAccount.number);
    await page.fill('input[name="digit"]', senderAccount.digit);
    await page.fill('input[name="transferValue"]', '50');
    await page.fill('input[name="description"]', 'Auto transferencia');
    await page.click('#btnTransferNow');

    await expect(page.locator('[role="dialog"], .modal, [class*="modal"]')).toContainText(
      'mesmo conta',
    );
  });

  test('Botão Voltar retorna para a home', async ({ page }) => {
    await registerUser(page, SENDER, true);
    await loginUser(page, SENDER);

    await page.click('#btn-TRANSFERÊNCIA');
    await page.click('#btnBack');

    await expect(page).toHaveURL(/\/home/);
  });
});
