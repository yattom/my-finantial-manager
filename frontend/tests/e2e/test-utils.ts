import { Page, expect } from '@playwright/test';

/**
 * Test utilities for Financial Asset Management System
 */

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Navigate to the home page and verify it loads correctly
   */
  async navigateToHome() {
    await this.page.goto('/');
    await expect(this.page).toHaveTitle('金融資産マネジメントシステム');
    await expect(this.page.getByRole('heading', { name: '金融資産マネジメントシステム' })).toBeVisible();
  }

  /**
   * Navigate to portfolio page from any page
   */
  async navigateToPortfolio() {
    await this.page.getByRole('button', { name: 'ポートフォリオを見る' }).click();
    await expect(this.page).toHaveURL('/portfolio');
    await expect(this.page).toHaveTitle('ポートフォリオ | 金融資産マネジメントシステム');
  }

  /**
   * Navigate to asset addition page from any page
   */
  async navigateToAssetAdd() {
    await this.page.getByRole('button', { name: '資産を追加' }).click();
    await expect(this.page).toHaveURL('/assets/add');
    await expect(this.page).toHaveTitle('資産追加 | 金融資産マネジメントシステム');
  }

  /**
   * Navigate to performance page from any page
   */
  async navigateToPerformance() {
    await this.page.getByRole('button', { name: 'パフォーマンスを分析' }).click();
    await expect(this.page).toHaveURL('/performance');
    await expect(this.page).toHaveTitle('パフォーマンス分析 | 金融資産マネジメントシステム');
  }

  /**
   * Navigate to price update page from any page
   */
  async navigateToPriceUpdate() {
    await this.page.getByRole('button', { name: '価格を更新' }).click();
    await expect(this.page).toHaveURL('/prices/update');
    await expect(this.page).toHaveTitle('価格更新 | 金融資産マネジメントシステム');
  }

  /**
   * Navigate back to home from any page
   */
  async navigateBackToHome() {
    await this.page.getByRole('button', { name: 'ホームに戻る' }).click();
    await expect(this.page).toHaveURL('/');
    await expect(this.page).toHaveTitle('金融資産マネジメントシステム');
  }

  /**
   * Add a test asset with the provided details
   * Adds a unique timestamp to the name to avoid duplicates
   */
  async addAsset(asset: {
    name: string;
    ticker: string;
    type: '株式' | '投資信託' | 'ETF' | '債券' | 'その他';
    quantity: number;
    price: number;
  }) {
    await this.navigateToAssetAdd();
    
    // Add timestamp to name to make it unique
    const uniqueName = `${asset.name}_${Date.now()}`;
    const uniqueTicker = `${asset.ticker}_${Date.now()}`;
    
    await this.page.getByRole('textbox', { name: '名称' }).fill(uniqueName);
    await this.page.getByRole('textbox', { name: 'ティッカーシンボル' }).fill(uniqueTicker);
    await this.page.getByLabel('種類').selectOption(asset.type);
    await this.page.getByRole('spinbutton', { name: '数量' }).fill(asset.quantity.toString());
    await this.page.getByRole('spinbutton', { name: '購入価格（円）' }).fill(asset.price.toString());
    
    await this.page.getByRole('button', { name: '追加する' }).click();
    
    // Should redirect to portfolio page
    await expect(this.page).toHaveURL('/portfolio');
    
    // Return the unique names for verification
    return { uniqueName, uniqueTicker };
  }

  /**
   * Wait for charts to be rendered (useful for performance tests)
   */
  async waitForChartsToLoad() {
    // Wait for any chart elements to be visible
    await this.page.waitForSelector('svg', { timeout: 10000 });
    // Additional wait to ensure charts are fully rendered
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify portfolio summary values
   */
  async verifyPortfolioSummary(expected: {
    totalAssets?: string;
    totalInvestment?: string;
    totalGainLoss?: string;
    performance?: string;
  }) {
    if (expected.totalAssets) {
      await expect(this.page.locator('text=総資産額').locator('..').locator('text=' + expected.totalAssets)).toBeVisible();
    }
    if (expected.totalInvestment) {
      await expect(this.page.locator('text=総投資額').locator('..').locator('text=' + expected.totalInvestment)).toBeVisible();
    }
    if (expected.totalGainLoss) {
      await expect(this.page.locator('text=総損益').locator('..').locator('text=' + expected.totalGainLoss)).toBeVisible();
    }
    if (expected.performance) {
      await expect(this.page.locator('text=パフォーマンス').locator('..').locator('text=' + expected.performance)).toBeVisible();
    }
  }

  /**
   * Clear all form fields in asset addition form
   */
  async clearAssetForm() {
    await this.page.getByRole('textbox', { name: '名称' }).clear();
    await this.page.getByRole('textbox', { name: 'ティッカーシンボル' }).clear();
    await this.page.getByRole('spinbutton', { name: '数量' }).clear();
    await this.page.getByRole('spinbutton', { name: '購入価格（円）' }).clear();
  }
}