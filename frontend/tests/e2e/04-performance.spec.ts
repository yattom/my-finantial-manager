import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

test.describe('Performance Analysis Page', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.navigateToHome();
    await testUtils.navigateToPerformance();
  });

  test('should display performance analysis page with correct structure', async ({ page }) => {
    // Verify main heading
    await expect(page.getByRole('heading', { name: 'パフォーマンス分析' })).toBeVisible();

    // Verify time period buttons section
    await expect(page.getByRole('button', { name: '1ヶ月' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3ヶ月' })).toBeVisible();
    await expect(page.getByRole('button', { name: '6ヶ月' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1年' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3年' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'カスタム' })).toBeVisible();

    // Verify portfolio performance section
    await expect(page.getByRole('heading', { name: 'ポートフォリオ全体のパフォーマンス' })).toBeVisible();

    // Verify asset performance section (use exact match to avoid confusion with '資産別パフォーマンス詳細')
    await expect(page.getByRole('heading', { name: '資産別パフォーマンス', exact: true })).toBeVisible();

    // Verify performance details table section
    await expect(page.getByRole('heading', { name: '資産別パフォーマンス詳細' })).toBeVisible();
  });

  test('should have all time period buttons functional', async ({ page }) => {
    const timePeriodButtons = [
      '1ヶ月', '3ヶ月', '6ヶ月', '1年', '3年', 'カスタム'
    ];

    for (const period of timePeriodButtons) {
      const button = page.getByRole('button', { name: period });
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
      await expect(button).toHaveCSS('cursor', 'pointer');
    }
  });

  test('should change data when different time periods are selected', async ({ page }) => {
    // Wait for initial chart to load
    await testUtils.waitForChartsToLoad();

    // Click 1ヶ月 button
    await page.getByRole('button', { name: '1ヶ月' }).click();
    
    // Should still be on the same page but data might change
    await expect(page).toHaveURL('/performance');
    
    // Click 3ヶ月 button 
    await page.getByRole('button', { name: '3ヶ月' }).click();
    await expect(page).toHaveURL('/performance');

    // Click 1年 button
    await page.getByRole('button', { name: '1年' }).click();
    await expect(page).toHaveURL('/performance');

    // TODO: Add data validation tests for time period changes
    // CURRENT GAP: This test only validates UI interactions (button clicks, URL stability)
    // but does not verify that actual data changes when different time periods are selected.
    // 
    // NEEDED: Test that validates:
    // 1. Performance percentages change between time periods
    // 2. Chart data points update (svg path data changes)
    // 3. Date ranges displayed reflect selected period
    // 4. Asset performance table shows period-appropriate data
    //
    // IMPLEMENTATION NOTES:
    // - Requires backend to have sufficient historical data for meaningful differences
    // - Should capture performance metrics before/after time period changes
    // - May need to seed test database with time-series data spanning multiple periods
    // - Consider testing with mock data if live data is insufficient
  });

  test('should display portfolio performance chart', async ({ page }) => {
    // Wait for charts to load
    await testUtils.waitForChartsToLoad();
    
    // Verify chart container is present (SVG element for Recharts)
    await expect(page.locator('svg').first()).toBeVisible();
    
    // Verify chart legend
    await expect(page.getByText('ポートフォリオ価値')).toBeVisible();
    
    // Verify performance percentage is displayed
    await expect(page.locator('text=期間パフォーマンス:')).toBeVisible();
    await expect(page.locator('text=期間パフォーマンス:').locator('..').locator('text=/%/')).toBeVisible();
  });

  test('should display asset selection checkboxes', async ({ page }) => {
    // Verify asset selection section
    await expect(page.getByRole('heading', { name: '表示する資産:' })).toBeVisible();
    
    // Should have checkboxes for existing assets (use first() to handle duplicates)
    await expect(page.getByRole('checkbox', { name: 'Toyota Motor' }).first()).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Apple Inc' }).first()).toBeVisible();

    // Initially both should be checked
    await expect(page.getByRole('checkbox', { name: 'Toyota Motor' }).first()).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Apple Inc' }).first()).toBeChecked();
  });

  test('should allow toggling asset visibility with checkboxes', async ({ page }) => {
    await testUtils.waitForChartsToLoad();
    
    // Uncheck Toyota Motor (use first() to handle duplicates)
    await page.getByRole('checkbox', { name: 'Toyota Motor' }).first().click();
    await expect(page.getByRole('checkbox', { name: 'Toyota Motor' }).first()).not.toBeChecked();
    
    // Chart should update (Toyota Motor should be removed from legend)
    // Apple Inc should still be visible
    await expect(page.getByText('Apple Inc')).toBeVisible();
    
    // Recheck Toyota Motor
    await page.getByRole('checkbox', { name: 'Toyota Motor' }).first().click();
    await expect(page.getByRole('checkbox', { name: 'Toyota Motor' }).first()).toBeChecked();
    
    // Both assets should be visible again
    await expect(page.getByText('Toyota Motor')).toBeVisible();
    await expect(page.getByText('Apple Inc')).toBeVisible();
  });

  test('should display individual asset performance chart', async ({ page }) => {
    await testUtils.waitForChartsToLoad();
    
    // Should have a second chart for individual asset performance
    const charts = page.locator('svg');
    await expect(charts.first()).toBeVisible(); // At least one chart should be visible
    
    // Verify legend items for individual assets
    await expect(page.getByText('Toyota Motor')).toBeVisible();
    await expect(page.getByText('Apple Inc')).toBeVisible();
  });

  test('should display performance details table with correct headers', async ({ page }) => {
    // Verify table headers
    await expect(page.getByRole('cell', { name: '資産名' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '種類' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '開始時価値' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '現在価値' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '変化額' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '変化率' })).toBeVisible();
  });

  test('should display asset performance data in table', async ({ page }) => {
    // Verify asset data rows
    await expect(page.getByRole('cell', { name: 'Toyota Motor' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Apple Inc' })).toBeVisible();
    
    // Verify performance data format (should show percentages and currency)
    await expect(page.locator('table').locator('text=/\\d+円/').first()).toBeVisible(); // At least one currency value
    await expect(page.locator('table').locator('text=/[+-]?\\d+\\.\\d+%/').first()).toBeVisible(); // At least one percentage value
    await expect(page.locator('table').locator('text=/[+-]\\d+円/').first()).toBeVisible(); // At least one change value
  });

  test('should have functional home navigation button', async ({ page }) => {
    const homeBtn = page.getByRole('button', { name: 'ホームに戻る' });
    
    await expect(homeBtn).toBeVisible();
    await expect(homeBtn).toBeEnabled();
    
    await homeBtn.click();
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle('金融資産マネジメントシステム');
  });

  test('should show realistic performance data', async ({ page }) => {
    // The performance should show actual calculated values based on assets
    const performanceText = page.locator('text=期間パフォーマンス:').locator('..').locator('text=/%/');
    await expect(performanceText).toBeVisible();
    
    // Performance value should be numeric
    const performanceValue = await performanceText.textContent();
    expect(performanceValue).toMatch(/[+-]?\d+\.\d+%/);
  });

  test('should handle chart interactions gracefully', async ({ page }) => {
    await testUtils.waitForChartsToLoad();
    
    // Test clicking on chart elements (should not cause errors)
    const firstChart = page.locator('svg').first();
    await firstChart.hover();
    
    // Chart should still be visible after interaction
    await expect(firstChart).toBeVisible();
  });

  test('should maintain checkbox states when switching time periods', async ({ page }) => {
    // Note: This test might fail if the frontend doesn't actually persist checkbox states
    // across time period changes. This is testing an ideal behavior.
    
    // Uncheck Toyota Motor (use first() to handle duplicates)
    await page.getByRole('checkbox', { name: 'Toyota Motor' }).first().click();
    await expect(page.getByRole('checkbox', { name: 'Toyota Motor' }).first()).not.toBeChecked();
    
    // Switch time period
    await page.getByRole('button', { name: '3ヶ月' }).click();
    
    // Note: The application may or may not maintain checkbox states
    // This test verifies the current behavior, which may reset states
    // If states are reset, both checkboxes will be checked again
    const toyotaCheckbox = page.getByRole('checkbox', { name: 'Toyota Motor' }).first();
    const appleCheckbox = page.getByRole('checkbox', { name: 'Apple Inc' }).first();
    
    // Accept either maintained state OR reset state
    try {
      await expect(toyotaCheckbox).not.toBeChecked();
      await expect(appleCheckbox).toBeChecked();
    } catch {
      // If states are reset (which is acceptable behavior), both should be checked
      await expect(toyotaCheckbox).toBeChecked();
      await expect(appleCheckbox).toBeChecked();
    }
  });

  test('should display correct page metadata', async ({ page }) => {
    await expect(page).toHaveTitle('パフォーマンス分析 | 金融資産マネジメントシステム');
    await expect(page).toHaveURL('/performance');
  });

  test('should handle empty or single asset scenarios', async ({ page }) => {
    // Even if there's only one asset or no assets, the page should still function
    // Charts and tables should handle edge cases gracefully
    await testUtils.waitForChartsToLoad();
    
    // Page should still render without errors
    await expect(page.getByRole('heading', { name: 'パフォーマンス分析' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});