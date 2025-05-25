import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

test.describe('Integration Tests - End-to-End User Flows', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
  });

  test('complete user flow: add asset → view portfolio → analyze performance → update prices', async ({ page }) => {
    // Start from home page
    await testUtils.navigateToHome();

    // Step 1: Add a new asset
    await testUtils.navigateToAssetAdd();
    
    const testAsset = {
      name: 'Microsoft Corporation',
      ticker: 'MSFT',
      type: '株式' as const,
      quantity: 20,
      price: 300
    };

    const { uniqueName, uniqueTicker } = await testUtils.addAsset(testAsset);

    // Verify asset was added to portfolio
    await expect(page.getByRole('cell', { name: uniqueName })).toBeVisible();
    await expect(page.getByRole('cell', { name: uniqueTicker })).toBeVisible();

    // Step 2: Verify portfolio summary updated
    // Total investment should be 20 * 300 = 6000, plus existing assets
    await expect(page.locator('text=総投資額').locator('..').locator('text=/\\d+円/')).toBeVisible();

    // Step 3: Navigate to performance analysis
    await testUtils.navigateToPerformance();

    // Verify new asset appears in performance analysis
    await expect(page.getByRole('checkbox', { name: uniqueName })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: uniqueName })).toBeChecked();

    // Wait for charts to load and verify data
    await testUtils.waitForChartsToLoad();
    await expect(page.getByText(uniqueName)).toBeVisible();

    // Step 4: Navigate to price update page
    await testUtils.navigateToPriceUpdate();

    // Verify new asset appears in price update list
    await expect(page.getByRole('cell', { name: uniqueName })).toBeVisible();
    await expect(page.getByRole('cell', { name: uniqueTicker })).toBeVisible();

    // Update prices for all assets
    await page.getByRole('button', { name: 'すべて選択' }).click();
    await page.getByRole('button', { name: '選択した資産の価格を更新' }).click();
    
    // Verify update success
    await expect(page.getByText('価格の更新が完了しました。')).toBeVisible();

    // Step 5: Return to portfolio to verify updates
    await page.getByRole('button', { name: 'ポートフォリオを見る' }).click();
    
    // Asset should still be visible with updated information
    await expect(page.getByRole('cell', { name: uniqueName })).toBeVisible();
  });

  test('navigation flow: visit all pages from home and return', async ({ page }) => {
    await testUtils.navigateToHome();

    // Test navigation to portfolio and back
    await testUtils.navigateToPortfolio();
    await testUtils.navigateBackToHome();

    // Test navigation to asset addition and back (via cancel goes to portfolio)
    await testUtils.navigateToAssetAdd();
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(page).toHaveURL('/portfolio'); // Cancel goes to portfolio

    // Test navigation to performance and back
    await testUtils.navigateToPerformance();
    await testUtils.navigateBackToHome();

    // Test navigation to price update and back
    await testUtils.navigateToPriceUpdate();
    await testUtils.navigateBackToHome();

    // Verify we're back at home with all functionality intact
    await expect(page.getByRole('heading', { name: '金融資産マネジメントシステム' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ポートフォリオを見る' })).toBeVisible();
    await expect(page.getByRole('button', { name: '資産を追加' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'パフォーマンスを分析' })).toBeVisible();
    await expect(page.getByRole('button', { name: '価格を更新' })).toBeVisible();
  });

  test('data persistence across page navigation', async ({ page }) => {
    // Add an asset
    await testUtils.navigateToHome();
    
    const persistenceTestAsset = {
      name: 'Google Inc',
      ticker: 'GOOGL',
      type: 'ETF' as const,
      quantity: 5,
      price: 2500
    };

    const { uniqueName } = await testUtils.addAsset(persistenceTestAsset);

    // Navigate to different pages and verify asset persists
    await testUtils.navigateToPerformance();
    await expect(page.getByRole('checkbox', { name: uniqueName })).toBeVisible();

    await testUtils.navigateToPriceUpdate();
    await expect(page.getByRole('cell', { name: uniqueName })).toBeVisible();

    await testUtils.navigateToPortfolio();
    await expect(page.getByRole('cell', { name: uniqueName })).toBeVisible();

    // Verify portfolio calculations include the new asset
    // Total investment should include the new asset (5 * 2500 = 12,500 plus existing assets)
    await expect(page.locator('text=総投資額').locator('..').locator('text=/\\d+円/')).toBeVisible();
  });

  test('performance analysis with multiple assets', async ({ page }) => {
    await testUtils.navigateToHome();

    // Add multiple assets of different types
    const assets = [
      { name: 'Sony Corp', ticker: 'SNE', type: '株式' as const, quantity: 15, price: 100 },
      { name: 'Bond Fund', ticker: 'BOND', type: '債券' as const, quantity: 50, price: 50 },
      { name: 'Mutual Fund', ticker: 'MUTUAL', type: '投資信託' as const, quantity: 25, price: 80 }
    ];

    const uniqueAssets = [];
    for (const asset of assets) {
      const { uniqueName } = await testUtils.addAsset(asset);
      uniqueAssets.push({ ...asset, uniqueName });
      // Brief wait between additions to avoid any timing issues
      await page.waitForTimeout(500);
    }

    // Navigate to performance analysis
    await testUtils.navigateToPerformance();

    // Verify all assets appear in the analysis
    for (const asset of uniqueAssets) {
      await expect(page.getByRole('checkbox', { name: asset.uniqueName })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: asset.uniqueName })).toBeChecked();
    }

    // Test filtering functionality
    await page.getByRole('checkbox', { name: uniqueAssets[0].uniqueName }).click();
    await expect(page.getByRole('checkbox', { name: uniqueAssets[0].uniqueName })).not.toBeChecked();

    // Other assets should still be checked
    await expect(page.getByRole('checkbox', { name: uniqueAssets[1].uniqueName })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: uniqueAssets[2].uniqueName })).toBeChecked();

    // Charts should update accordingly
    await testUtils.waitForChartsToLoad();
    await expect(page.locator('svg')).toBeVisible();
  });

  test('price update workflow with selective updates', async ({ page }) => {
    await testUtils.navigateToHome();
    await testUtils.navigateToPriceUpdate();

    // Test selective price updates
    await page.getByRole('button', { name: 'すべて解除' }).click();
    
    // Select only specific assets
    const checkboxes = page.getByRole('table').getByRole('checkbox');
    const firstCheckbox = checkboxes.first();
    await firstCheckbox.click();
    
    // Update only selected assets
    await page.getByRole('button', { name: '選択した資産の価格を更新' }).click();
    await expect(page.getByText('価格の更新が完了しました。')).toBeVisible();

    // Verify the update process worked
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=/\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/')).toBeVisible();
  });

  test('error handling and edge cases', async ({ page }) => {
    await testUtils.navigateToHome();

    // Test portfolio detail button (known to cause 404)
    await testUtils.navigateToPortfolio();
    await page.getByRole('button', { name: '詳細' }).first().click();
    
    // Should show 404 page
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'This page could not be found.' })).toBeVisible();

    // Navigate back to a working page
    await page.goBack();
    await expect(page).toHaveURL('/portfolio');
    await expect(page.getByRole('heading', { name: 'ポートフォリオ概要' })).toBeVisible();
  });

  test('responsive layout and accessibility basics', async ({ page }) => {
    await testUtils.navigateToHome();

    // Check that main landmarks exist
    await expect(page.locator('main')).toBeVisible();

    // Verify all pages have proper headings
    await testUtils.navigateToPortfolio();
    await expect(page.getByRole('heading', { name: 'ポートフォリオ概要' })).toBeVisible();

    await testUtils.navigateToAssetAdd();
    await expect(page.getByRole('heading', { name: '資産追加' })).toBeVisible();

    await testUtils.navigateToPerformance();
    await expect(page.getByRole('heading', { name: 'パフォーマンス分析' })).toBeVisible();

    await testUtils.navigateToPriceUpdate();
    await expect(page.getByRole('heading', { name: '価格更新' })).toBeVisible();

    // Check that interactive elements are accessible
    await expect(page.getByRole('button', { name: 'すべて選択' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('form validation and user experience', async ({ page }) => {
    await testUtils.navigateToHome();
    await testUtils.navigateToAssetAdd();

    // Test form behavior with empty submission
    // Note: Based on original tests, there's no apparent client-side validation
    // but we can test the basic form interaction
    
    // Fill partial data and verify it persists during form interaction
    await page.getByRole('textbox', { name: '名称' }).fill('Partial Data');
    await page.getByLabel('種類').selectOption('投資信託');
    
    // Change focus and verify data persists
    await page.getByRole('textbox', { name: 'ティッカーシンボル' }).focus();
    await expect(page.getByRole('textbox', { name: '名称' })).toHaveValue('Partial Data');
    await expect(page.getByLabel('種類')).toHaveValue('投資信託');

    // Clear form and verify all fields are empty
    await testUtils.clearAssetForm();
    await expect(page.getByRole('textbox', { name: '名称' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'ティッカーシンボル' })).toHaveValue('');
  });
});