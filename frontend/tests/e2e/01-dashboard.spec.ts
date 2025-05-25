import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

test.describe('Dashboard/Home Page', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.navigateToHome();
  });

  test('should display the main title and all feature cards', async ({ page }) => {
    // Verify main title
    await expect(page.getByRole('heading', { name: '金融資産マネジメントシステム' })).toBeVisible();

    // Verify all 4 feature cards are present
    await expect(page.getByRole('heading', { name: 'ポートフォリオ概要' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '資産追加' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'パフォーマンス分析' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '価格更新' })).toBeVisible();
  });

  test('should display descriptive text for each feature', async ({ page }) => {
    // Verify feature descriptions
    await expect(page.getByText('あなたの金融資産の概要を確認できます。')).toBeVisible();
    await expect(page.getByText('新しい株式や投資信託を追加します。')).toBeVisible();
    await expect(page.getByText('期間を指定して資産のパフォーマンスを分析します。')).toBeVisible();
    await expect(page.getByText('保有銘柄の最新価格を取得します。')).toBeVisible();
  });

  test('should have all navigation buttons present and clickable', async ({ page }) => {
    // Verify all navigation buttons exist and are clickable
    const portfolioBtn = page.getByRole('button', { name: 'ポートフォリオを見る' });
    const addAssetBtn = page.getByRole('button', { name: '資産を追加' });
    const performanceBtn = page.getByRole('button', { name: 'パフォーマンスを分析' });
    const priceUpdateBtn = page.getByRole('button', { name: '価格を更新' });

    await expect(portfolioBtn).toBeVisible();
    await expect(addAssetBtn).toBeVisible();
    await expect(performanceBtn).toBeVisible();
    await expect(priceUpdateBtn).toBeVisible();

    // Verify buttons are enabled
    await expect(portfolioBtn).toBeEnabled();
    await expect(addAssetBtn).toBeEnabled();
    await expect(performanceBtn).toBeEnabled();
    await expect(priceUpdateBtn).toBeEnabled();
  });

  test('should navigate to portfolio page when portfolio button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'ポートフォリオを見る' }).click();
    
    await expect(page).toHaveURL('/portfolio');
    await expect(page).toHaveTitle('ポートフォリオ | 金融資産マネジメントシステム');
    await expect(page.getByRole('heading', { name: 'ポートフォリオ概要' })).toBeVisible();
  });

  test('should navigate to asset addition page when add asset button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: '資産を追加' }).click();
    
    await expect(page).toHaveURL('/assets/add');
    await expect(page).toHaveTitle('資産追加 | 金融資産マネジメントシステム');
    await expect(page.getByRole('heading', { name: '資産追加' })).toBeVisible();
  });

  test('should navigate to performance page when performance button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'パフォーマンスを分析' }).click();
    
    await expect(page).toHaveURL('/performance');
    await expect(page).toHaveTitle('パフォーマンス分析 | 金融資産マネジメントシステム');
    await expect(page.getByRole('heading', { name: 'パフォーマンス分析' })).toBeVisible();
  });

  test('should navigate to price update page when price update button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: '価格を更新' }).click();
    
    await expect(page).toHaveURL('/prices/update');
    await expect(page).toHaveTitle('価格更新 | 金融資産マネジメントシステム');
    await expect(page.getByRole('heading', { name: '価格更新' })).toBeVisible();
  });

  test('should maintain consistent layout and styling', async ({ page }) => {
    // Test that the page has a proper main content area
    await expect(page.locator('main')).toBeVisible();
    
    // Verify that all buttons have the pointer cursor (indicating they're interactive)
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      await expect(button).toHaveCSS('cursor', 'pointer');
    }
  });
});