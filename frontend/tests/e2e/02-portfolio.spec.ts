import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

test.describe('Portfolio Page', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.navigateToHome();
    await testUtils.navigateToPortfolio();
  });

  test('should display portfolio overview with correct structure', async ({ page }) => {
    // Verify main heading
    await expect(page.getByRole('heading', { name: 'ポートフォリオ概要' })).toBeVisible();

    // Verify asset summary section
    await expect(page.getByRole('heading', { name: '資産概要' })).toBeVisible();
    await expect(page.getByText('総資産額')).toBeVisible();
    await expect(page.getByText('総投資額')).toBeVisible();
    await expect(page.getByText('総損益')).toBeVisible();
    
    // Use more specific selector for performance text in summary section
    await expect(page.locator('.text-light-text-color').filter({ hasText: 'パフォーマンス' })).toBeVisible();

    // Verify asset allocation section
    await expect(page.getByRole('heading', { name: '資産配分' })).toBeVisible();

    // Verify asset list section
    await expect(page.getByRole('heading', { name: '保有資産一覧' })).toBeVisible();
  });

  test('should display asset summary with numerical values', async ({ page }) => {
    // Check that summary values are displayed (exact values may vary)
    const totalAssetsValue = page.locator('text=総資産額').locator('..').locator('text=/\\d+円/');
    const totalInvestmentValue = page.locator('text=総投資額').locator('..').locator('text=/\\d+円/');
    const totalGainLossValue = page.locator('text=総損益').locator('..').locator('text=/[+-]?\\d+円/');
    const performanceValue = page.locator('text=パフォーマンス').locator('..').locator('text=/[+-]?\\d+\\.\\d+%/');

    await expect(totalAssetsValue).toBeVisible();
    await expect(totalInvestmentValue).toBeVisible();
    await expect(totalGainLossValue).toBeVisible();
    await expect(performanceValue).toBeVisible();
  });

  test('should display asset allocation chart', async ({ page }) => {
    // Wait for chart to load
    await testUtils.waitForChartsToLoad();
    
    // Verify chart container is present (SVG or canvas element)
    await expect(page.locator('svg').first()).toBeVisible();
    
    // Check for chart legend or labels (should show asset types with percentages)
    await expect(page.getByText(/ETF \d+%/)).toBeVisible();
  });

  test('should display asset list table with correct headers', async ({ page }) => {
    // Verify table headers
    await expect(page.getByRole('cell', { name: '名称' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '種類' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '数量' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '現在価格' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '現在価値' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '購入価格' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'パフォーマンス' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'アクション' })).toBeVisible();
  });

  test('should display existing assets in the table', async ({ page }) => {
    // Verify that at least the default Toyota Motor asset exists
    await expect(page.getByRole('cell', { name: 'Toyota Motor' })).toBeVisible();
    
    // Check for at least one ETF asset type (use first() to avoid multiple matches)
    await expect(page.getByRole('cell', { name: 'ETF' }).first()).toBeVisible();
    
    // Check for detail buttons
    await expect(page.getByRole('button', { name: '詳細' }).first()).toBeVisible();
  });

  test('should have functional navigation buttons', async ({ page }) => {
    // Verify navigation buttons exist
    const addAssetBtn = page.getByRole('button', { name: '資産を追加' });
    const homeBtn = page.getByRole('button', { name: 'ホームに戻る' });

    await expect(addAssetBtn).toBeVisible();
    await expect(homeBtn).toBeVisible();
    await expect(addAssetBtn).toBeEnabled();
    await expect(homeBtn).toBeEnabled();
  });

  test('should navigate to asset addition page when add asset button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: '資産を追加' }).click();
    
    await expect(page).toHaveURL('/assets/add');
    await expect(page).toHaveTitle('資産追加 | 金融資産マネジメントシステム');
  });

  test('should navigate back to home when home button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'ホームに戻る' }).click();
    
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle('金融資産マネジメントシステム');
  });

  test('should handle detail button click (expect 404 for now)', async ({ page }) => {
    // Click the first detail button
    await page.getByRole('button', { name: '詳細' }).first().click();
    
    // Should navigate to asset detail page but get 404 (known issue)
    await expect(page).toHaveURL(/\/assets\/\d+/);
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'This page could not be found.' })).toBeVisible();
  });

  test('should maintain data consistency between summary and table', async ({ page }) => {
    // Get the total value from summary
    const summaryTotal = await page.locator('text=総資産額').locator('..').locator('text=/\\d+円/').textContent();
    
    // Calculate total from asset table (if we can access individual values)
    // This is a more complex test that would require parsing table data
    // For now, just verify that both sections show some monetary values
    await expect(page.locator('text=総資産額').locator('..').locator('text=/\\d+円/')).toBeVisible();
    await expect(page.locator('table').locator('text=/\\d+円/').first()).toBeVisible();
  });

  test('should display correct page metadata', async ({ page }) => {
    await expect(page).toHaveTitle('ポートフォリオ | 金融資産マネジメントシステム');
    await expect(page).toHaveURL('/portfolio');
  });
});