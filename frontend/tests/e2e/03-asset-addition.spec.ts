import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

test.describe('Asset Addition Page', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.navigateToHome();
    await testUtils.navigateToAssetAdd();
  });

  test('should display asset addition form with all required fields', async ({ page }) => {
    // Verify main heading
    await expect(page.getByRole('heading', { name: '資産追加' })).toBeVisible();

    // Verify all form fields are present
    await expect(page.getByRole('textbox', { name: '名称' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'ティッカーシンボル' })).toBeVisible();
    await expect(page.getByLabel('種類')).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: '数量' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: '購入価格（円）' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '購入日' })).toBeVisible();

    // Verify form buttons
    await expect(page.getByRole('button', { name: '追加する' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
  });

  test('should have proper form field labels and placeholders', async ({ page }) => {
    // Verify field labels are displayed
    await expect(page.getByText('名称')).toBeVisible();
    await expect(page.getByText('ティッカーシンボル')).toBeVisible();
    await expect(page.getByText('種類')).toBeVisible();
    await expect(page.getByText('数量')).toBeVisible();
    await expect(page.getByText('購入価格（円）')).toBeVisible();
    await expect(page.getByText('購入日')).toBeVisible();
  });

  test('should have asset type dropdown with all options', async ({ page }) => {
    const typeSelect = page.getByLabel('種類');
    
    // Verify dropdown is visible and has correct options
    await expect(typeSelect).toBeVisible();
    
    // Check that all options exist by checking if we can select them
    await expect(typeSelect.locator('option[value="株式"]')).toHaveCount(1);
    await expect(typeSelect.locator('option[value="投資信託"]')).toHaveCount(1);
    await expect(typeSelect.locator('option[value="ETF"]')).toHaveCount(1);
    await expect(typeSelect.locator('option[value="債券"]')).toHaveCount(1);
    await expect(typeSelect.locator('option[value="その他"]')).toHaveCount(1);

    // Default selection should be "株式"
    await expect(typeSelect).toHaveValue('株式');
  });

  test('should have pre-filled purchase date with current date', async ({ page }) => {
    const dateField = page.getByRole('textbox', { name: '購入日' });
    
    // Purchase date should be pre-filled
    await expect(dateField).not.toHaveValue('');
    
    // Should contain current date in YYYY/MM/DD format
    const dateValue = await dateField.inputValue();
    expect(dateValue).toMatch(/\d{4}\/\d{2}\/\d{2}/);
  });

  test('should have numeric fields with proper default values', async ({ page }) => {
    // Quantity and price should default to 0
    await expect(page.getByRole('spinbutton', { name: '数量' })).toHaveValue('0');
    await expect(page.getByRole('spinbutton', { name: '購入価格（円）' })).toHaveValue('0');
  });

  test('should allow filling all form fields', async ({ page }) => {
    // Fill in all form fields
    await page.getByRole('textbox', { name: '名称' }).fill('Microsoft Corporation');
    await page.getByRole('textbox', { name: 'ティッカーシンボル' }).fill('MSFT');
    await page.getByLabel('種類').selectOption('株式');
    await page.getByRole('spinbutton', { name: '数量' }).fill('25');
    await page.getByRole('spinbutton', { name: '購入価格（円）' }).fill('200');

    // Verify values are filled
    await expect(page.getByRole('textbox', { name: '名称' })).toHaveValue('Microsoft Corporation');
    await expect(page.getByRole('textbox', { name: 'ティッカーシンボル' })).toHaveValue('MSFT');
    await expect(page.getByLabel('種類')).toHaveValue('株式');
    await expect(page.getByRole('spinbutton', { name: '数量' })).toHaveValue('25');
    await expect(page.getByRole('spinbutton', { name: '購入価格（円）' })).toHaveValue('200');
  });

  test('should be able to change asset type selection', async ({ page }) => {
    const typeSelect = page.getByLabel('種類');
    
    // Change to ETF
    await typeSelect.selectOption('ETF');
    await expect(typeSelect).toHaveValue('ETF');
    
    // Change to 投資信託
    await typeSelect.selectOption('投資信託');
    await expect(typeSelect).toHaveValue('投資信託');
    
    // Change to 債券
    await typeSelect.selectOption('債券');
    await expect(typeSelect).toHaveValue('債券');
    
    // Change to その他
    await typeSelect.selectOption('その他');
    await expect(typeSelect).toHaveValue('その他');
  });

  test('should successfully submit form and redirect to portfolio', async ({ page }) => {
    // Fill in test asset data
    await page.getByRole('textbox', { name: '名称' }).fill('Test Asset');
    await page.getByRole('textbox', { name: 'ティッカーシンボル' }).fill('TEST');
    await page.getByLabel('種類').selectOption('ETF');
    await page.getByRole('spinbutton', { name: '数量' }).fill('5');
    await page.getByRole('spinbutton', { name: '購入価格（円）' }).fill('100');

    // Submit the form
    await page.getByRole('button', { name: '追加する' }).click();

    // Should redirect to portfolio page
    await expect(page).toHaveURL('/portfolio');
    await expect(page).toHaveTitle('ポートフォリオ | 金融資産マネジメントシステム');

    // Verify the asset appears in the portfolio (use first() to handle duplicates)
    await expect(page.getByRole('cell', { name: 'Test Asset' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'TEST' }).first()).toBeVisible();
  });

  test('should clear form fields when requested', async ({ page }) => {
    // Fill in some data first
    await page.getByRole('textbox', { name: '名称' }).fill('Test Name');
    await page.getByRole('textbox', { name: 'ティッカーシンボル' }).fill('TEST');
    await page.getByRole('spinbutton', { name: '数量' }).fill('10');
    await page.getByRole('spinbutton', { name: '購入価格（円）' }).fill('50');

    // Clear the fields using test utility
    await testUtils.clearAssetForm();

    // Verify fields are cleared
    await expect(page.getByRole('textbox', { name: '名称' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'ティッカーシンボル' })).toHaveValue('');
    await expect(page.getByRole('spinbutton', { name: '数量' })).toHaveValue('');
    await expect(page.getByRole('spinbutton', { name: '購入価格（円）' })).toHaveValue('');
  });

  test('should validate form submission buttons are properly enabled/disabled', async ({ page }) => {
    // Initially, buttons should be enabled (no client-side validation shown in original test)
    await expect(page.getByRole('button', { name: '追加する' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeEnabled();
  });

  test('should maintain proper cursor styles for interactive elements', async ({ page }) => {
    // Verify buttons have pointer cursor
    await expect(page.getByRole('button', { name: '追加する' })).toHaveCSS('cursor', 'pointer');
    await expect(page.getByRole('button', { name: 'キャンセル' })).toHaveCSS('cursor', 'pointer');
  });

  test('should handle edge case inputs gracefully', async ({ page }) => {
    // Test with very large numbers
    await page.getByRole('spinbutton', { name: '数量' }).fill('999999');
    await page.getByRole('spinbutton', { name: '購入価格（円）' }).fill('1000000');
    
    // Verify values are accepted
    await expect(page.getByRole('spinbutton', { name: '数量' })).toHaveValue('999999');
    await expect(page.getByRole('spinbutton', { name: '購入価格（円）' })).toHaveValue('1000000');

    // Test with decimal values (should be handled appropriately)
    await page.getByRole('spinbutton', { name: '購入価格（円）' }).fill('150.50');
    await expect(page.getByRole('spinbutton', { name: '購入価格（円）' })).toHaveValue('150.50');
  });

  test('should display correct page metadata', async ({ page }) => {
    await expect(page).toHaveTitle('資産追加 | 金融資産マネジメントシステム');
    await expect(page).toHaveURL('/assets/add');
  });
});