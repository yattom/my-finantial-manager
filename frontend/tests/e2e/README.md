# E2E Tests for Financial Asset Management System

This directory contains end-to-end tests for the Financial Asset Management System using Playwright.

## Test Structure

### Test Files

1. **01-dashboard.spec.ts** - Tests the main dashboard/home page functionality
2. **02-portfolio.spec.ts** - Tests portfolio overview page
3. **03-asset-addition.spec.ts** - Tests asset addition form and functionality
4. **04-performance.spec.ts** - Tests performance analysis page with charts and filters
5. **05-price-update.spec.ts** - Tests price update functionality
6. **06-integration.spec.ts** - End-to-end integration tests covering complete user flows

### Test Utils

- **test-utils.ts** - Common utilities and helper functions for navigation and assertions

## Prerequisites

1. **Dependencies**: Ensure Playwright is installed:
   ```bash
   npm install
   ```

2. **Application Running**: The application must be running before executing tests:
   ```bash
   # Backend (in backend directory)
   poetry run uvicorn app.main:app --reload

   # Frontend (in frontend directory)  
   npm run dev
   ```

   Or using Docker:
   ```bash
   docker-compose up -d
   ```

3. **Browser Installation**: Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### With UI Mode (Recommended for development)
```bash
npm run test:e2e:ui
```

### Headed Mode (See browser interactions)
```bash
npm run test:e2e:headed
```

### Specific Test File
```bash
npx playwright test 01-dashboard.spec.ts
```

### Debug Mode
```bash
npx playwright test --debug
```

## Test Coverage

### Dashboard/Home Page (01-dashboard.spec.ts)
- ✅ Main title and feature cards display
- ✅ Navigation buttons functionality  
- ✅ Page layout and styling
- ✅ Links to all main features

### Portfolio Page (02-portfolio.spec.ts)
- ✅ Asset summary with calculations
- ✅ Asset allocation pie chart
- ✅ Asset list table with data
- ✅ Navigation buttons
- ⚠️ Detail button (known 404 issue)

### Asset Addition (03-asset-addition.spec.ts)
- ✅ Form field validation and input
- ✅ Dropdown selection for asset types
- ✅ Form submission and data persistence
- ✅ Redirect to portfolio after successful addition
- ✅ Edge case handling

### Performance Analysis (04-performance.spec.ts)
- ✅ Time period selection buttons
- ✅ Portfolio performance charts
- ✅ Asset filtering with checkboxes
- ✅ Individual asset performance charts
- ✅ Performance details table
- ✅ Chart interactions and data updates

### Price Update (05-price-update.spec.ts)
- ✅ Asset selection table
- ✅ Bulk selection/deselection
- ✅ Individual checkbox controls
- ✅ Price update functionality
- ✅ Success confirmation
- ✅ Button enable/disable logic

### Integration Tests (06-integration.spec.ts)
- ✅ Complete user flows (add asset → view portfolio → analyze → update)
- ✅ Navigation between all pages
- ✅ Data persistence across pages
- ✅ Multiple asset management
- ✅ Error handling and edge cases
- ✅ Basic accessibility checks

## Known Issues

1. **Asset Detail Pages**: The "詳細" (detail) buttons in the portfolio lead to 404 errors as these pages are not implemented yet.

2. **Price Update Timing**: Price updates may not always show immediate timestamp changes depending on backend implementation.

## TODO: Future Test Enhancements

### High Priority
1. **Time Period Data Validation** (Performance Page)
   - Currently only tests UI interactions when changing time periods
   - **Gap**: No validation that actual data/charts change between 1ヶ月, 3ヶ月, 1年, etc.
   - **Needed**: Test performance percentages, chart data points, and date ranges change appropriately
   - **Blocker**: Requires sufficient historical test data or data mocking

### Medium Priority  
2. **Asset Detail Page Implementation**
   - Add tests for individual asset detail views once pages are implemented
   - Test asset-specific performance charts and data

3. **Error Handling Tests**
   - Test behavior when backend is unavailable
   - Test handling of invalid asset data
   - Test network timeout scenarios

4. **Real-time Data Updates**
   - Test price update polling/refresh behavior
   - Test data consistency across page navigation

### Low Priority
5. **Accessibility Testing**
   - Add comprehensive a11y tests using axe-core
   - Test keyboard navigation
   - Test screen reader compatibility

6. **Mobile Responsiveness**
   - Add mobile viewport tests
   - Test touch interactions
   - Test responsive chart rendering

## Test Configuration

The tests are configured to:
- Run against `http://localhost:3000`
- Support multiple browsers (Chromium, Firefox, Safari)
- Automatically start the dev server if not running
- Generate HTML reports
- Capture traces on test failures

## Writing New Tests

When adding new tests:

1. Use the `TestUtils` class for common navigation operations
2. Follow the existing naming convention (`##-feature.spec.ts`)
3. Include proper test descriptions in Japanese where UI text is Japanese
4. Use appropriate waits for charts and async operations (`waitForChartsToLoad()`)
5. Test both positive and negative scenarios
6. Include accessibility and responsive design checks where appropriate

## Debugging Tips

1. **Use UI Mode**: `npm run test:e2e:ui` provides a great visual debugging experience
2. **Use Debug Mode**: `npx playwright test --debug` allows step-by-step debugging
3. **Screenshots**: Tests automatically capture screenshots on failure
4. **Console Logs**: Check browser console for JavaScript errors
5. **Network Tab**: Monitor API calls in the Playwright trace viewer

## Best Practices

1. **Page Object Pattern**: Use the TestUtils class for common operations
2. **Stable Selectors**: Use role-based selectors over CSS selectors when possible
3. **Explicit Waits**: Wait for specific conditions rather than arbitrary timeouts
4. **Test Isolation**: Each test should be independent and clean up after itself
5. **Meaningful Assertions**: Verify both UI state and data correctness