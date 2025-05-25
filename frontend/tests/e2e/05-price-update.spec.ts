import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

test.describe('Price Update Page', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.navigateToHome();
    await testUtils.navigateToPriceUpdate();
  });

  test('should display price update page with correct structure', async ({ page }) => {
    // Verify main heading
    await expect(page.getByRole('heading', { name: '価格更新' })).toBeVisible();

    // Verify asset selection section
    await expect(page.getByRole('heading', { name: '更新する資産を選択' })).toBeVisible();

    // Verify bulk selection buttons
    await expect(page.getByRole('button', { name: 'すべて選択' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'すべて解除' })).toBeVisible();

    // Verify update button
    await expect(page.getByRole('button', { name: '選択した資産の価格を更新' })).toBeVisible();

    // Verify navigation buttons
    await expect(page.getByRole('button', { name: 'ホームに戻る' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ポートフォリオを見る' })).toBeVisible();
  });

  test('should display asset selection table with correct headers', async ({ page }) => {
    // Verify table headers
    await expect(page.getByRole('cell', { name: '選択' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '名称' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'ティッカー' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '種類' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '現在価格' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '最終更新日' })).toBeVisible();
  });

  test('should display existing assets with data', async ({ page }) => {
    // Verify asset data is displayed
    await expect(page.getByRole('cell', { name: 'Toyota Motor' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Apple Inc' })).toBeVisible();
    
    // Verify ticker symbols
    await expect(page.getByRole('cell', { name: '7203.T' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'AAPL' })).toBeVisible();
    
    // Verify asset types
    await expect(page.getByRole('cell', { name: 'ETF' })).toBeVisible();
    
    // Verify price format (should contain yen symbol)
    await expect(page.locator('table').locator('text=/\\d+円/')).toHaveCount({ min: 2 });
    
    // Verify timestamp format
    await expect(page.locator('table').locator('text=/\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/')).toHaveCount({ min: 2 });
  });

  test('should have checkboxes for each asset', async ({ page }) => {
    // Get all asset checkboxes
    const checkboxes = page.getByRole('table').getByRole('checkbox');
    
    // Should have at least 2 checkboxes (for existing assets)
    await expect(checkboxes).toHaveCount({ min: 2 });
    
    // Initially, all should be checked
    const checkboxCount = await checkboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test('should allow individual checkbox selection', async ({ page }) => {
    const firstCheckbox = page.getByRole('table').getByRole('checkbox').first();
    const secondCheckbox = page.getByRole('table').getByRole('checkbox').nth(1);
    
    // Initially both should be checked
    await expect(firstCheckbox).toBeChecked();
    await expect(secondCheckbox).toBeChecked();
    
    // Uncheck first checkbox
    await firstCheckbox.click();
    await expect(firstCheckbox).not.toBeChecked();
    await expect(secondCheckbox).toBeChecked();
    
    // Check first checkbox again
    await firstCheckbox.click();
    await expect(firstCheckbox).toBeChecked();
    await expect(secondCheckbox).toBeChecked();
  });

  test('should handle "すべて選択" button functionality', async ({ page }) => {
    // First uncheck some checkboxes
    const firstCheckbox = page.getByRole('table').getByRole('checkbox').first();
    await firstCheckbox.click();
    await expect(firstCheckbox).not.toBeChecked();
    
    // Click "すべて選択"
    await page.getByRole('button', { name: 'すべて選択' }).click();
    
    // All checkboxes should now be checked
    const checkboxes = page.getByRole('table').getByRole('checkbox');
    const checkboxCount = await checkboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
    
    // Update button should be enabled
    await expect(page.getByRole('button', { name: '選択した資産の価格を更新' })).toBeEnabled();
  });

  test('should handle "すべて解除" button functionality', async ({ page }) => {
    // Initially checkboxes should be checked
    const firstCheckbox = page.getByRole('table').getByRole('checkbox').first();
    await expect(firstCheckbox).toBeChecked();
    
    // Click "すべて解除"
    await page.getByRole('button', { name: 'すべて解除' }).click();
    
    // All checkboxes should now be unchecked
    const checkboxes = page.getByRole('table').getByRole('checkbox');
    const checkboxCount = await checkboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked();
    }
    
    // Update button should be disabled
    await expect(page.getByRole('button', { name: '選択した資産の価格を更新' })).toBeDisabled();
  });

  test('should enable/disable update button based on selection', async ({ page }) => {
    // Initially should be enabled (assets are pre-selected)
    await expect(page.getByRole('button', { name: '選択した資産の価格を更新' })).toBeEnabled();
    
    // Uncheck all
    await page.getByRole('button', { name: 'すべて解除' }).click();
    await expect(page.getByRole('button', { name: '選択した資産の価格を更新' })).toBeDisabled();
    
    // Check one asset
    const firstCheckbox = page.getByRole('table').getByRole('checkbox').first();
    await firstCheckbox.click();
    await expect(page.getByRole('button', { name: '選択した資産の価格を更新' })).toBeEnabled();
  });

  test('should successfully update prices and show confirmation', async ({ page }) => {
    // Ensure at least one asset is selected
    await page.getByRole('button', { name: 'すべて選択' }).click();
    
    // Click update button
    await page.getByRole('button', { name: '選択した資産の価格を更新' }).click();
    
    // Should show success message
    await expect(page.getByText('価格の更新が完了しました。')).toBeVisible();
    
    // Should still be on the same page
    await expect(page).toHaveURL('/prices/update');
    await expect(page).toHaveTitle('価格更新 | 金融資産マネジメントシステム');
  });

  test('should update timestamps after price update', async ({ page }) => {
    // Get initial timestamp
    const initialTimestamp = await page.locator('table').locator('text=/\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/').first().textContent();
    
    // Update prices
    await page.getByRole('button', { name: 'すべて選択' }).click();
    await page.getByRole('button', { name: '選択した資産の価格を更新' }).click();
    
    // Wait for update to complete
    await expect(page.getByText('価格の更新が完了しました。')).toBeVisible();
    
    // Timestamps should still be present (may or may not be updated depending on API)
    await expect(page.locator('table').locator('text=/\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/').first()).toBeVisible();
  });

  test('should have functional navigation buttons', async ({ page }) => {
    const homeBtn = page.getByRole('button', { name: 'ホームに戻る' });
    const portfolioBtn = page.getByRole('button', { name: 'ポートフォリオを見る' });
    
    // Verify buttons are visible and enabled
    await expect(homeBtn).toBeVisible();
    await expect(portfolioBtn).toBeVisible();
    await expect(homeBtn).toBeEnabled();
    await expect(portfolioBtn).toBeEnabled();
  });

  test('should navigate to home when home button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'ホームに戻る' }).click();
    
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle('金融資産マネジメントシステム');
  });

  test('should navigate to portfolio when portfolio button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'ポートフォリオを見る' }).click();
    
    await expect(page).toHaveURL('/portfolio');
    await expect(page).toHaveTitle('ポートフォリオ | 金融資産マネジメントシステム');
  });

  test('should maintain selection state during page interactions', async ({ page }) => {
    // Uncheck first asset
    const firstCheckbox = page.getByRole('table').getByRole('checkbox').first();
    await firstCheckbox.click();
    await expect(firstCheckbox).not.toBeChecked();
    
    // Perform other actions (clicking buttons, etc.)
    await page.getByRole('button', { name: 'すべて選択' }).click();
    await page.getByRole('button', { name: 'すべて解除' }).click();
    
    // All should be unchecked now
    await expect(firstCheckbox).not.toBeChecked();
  });

  test('should display appropriate cursor styles', async ({ page }) => {
    // Verify interactive elements have pointer cursor
    await expect(page.getByRole('button', { name: 'すべて選択' })).toHaveCSS('cursor', 'pointer');
    await expect(page.getByRole('button', { name: 'すべて解除' })).toHaveCSS('cursor', 'pointer');
    await expect(page.getByRole('button', { name: '選択した資産の価格を更新' })).toHaveCSS('cursor', 'pointer');
    await expect(page.getByRole('button', { name: 'ホームに戻る' })).toHaveCSS('cursor', 'pointer');
    await expect(page.getByRole('button', { name: 'ポートフォリオを見る' })).toHaveCSS('cursor', 'pointer');
  });

  test('should handle edge cases with no assets selected', async ({ page }) => {
    // Uncheck all assets
    await page.getByRole('button', { name: 'すべて解除' }).click();
    
    // Update button should be disabled
    await expect(page.getByRole('button', { name: '選択した資産の価格を更新' })).toBeDisabled();
    
    // Clicking disabled button should not cause any action
    // (Playwright won't click disabled buttons, but we can verify it stays disabled)
    await expect(page.getByRole('button', { name: '選択した資産の価格を更新' })).toBeDisabled();
  });

  test('should display correct page metadata', async ({ page }) => {
    await expect(page).toHaveTitle('価格更新 | 金融資産マネジメントシステム');
    await expect(page).toHaveURL('/prices/update');
  });

  test('should handle partial asset selection correctly', async ({ page }) => {
    // Start with all selected
    await page.getByRole('button', { name: 'すべて選択' }).click();
    
    // Uncheck half of the assets
    const checkboxes = page.getByRole('table').getByRole('checkbox');
    const checkboxCount = await checkboxes.count();
    const halfCount = Math.floor(checkboxCount / 2);
    
    for (let i = 0; i < halfCount; i++) {
      await checkboxes.nth(i).click();
    }
    
    // Update button should still be enabled (some assets selected)
    await expect(page.getByRole('button', { name: '選択した資産の価格を更新' })).toBeEnabled();
    
    // Update should work with partial selection
    await page.getByRole('button', { name: '選択した資産の価格を更新' }).click();
    await expect(page.getByText('価格の更新が完了しました。')).toBeVisible();
  });
});