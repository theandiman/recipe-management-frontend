# E2E Testing with Playwright

## Setup

### Prerequisites
1. Install dependencies: `npm install`
2. Install Playwright browsers: `npx playwright install --with-deps`

### Test Mode

The E2E tests run in **test mode**, which bypasses authentication requirements. This is controlled by the `VITE_TEST_MODE` environment variable, which is automatically set when running Playwright tests.

**No authentication setup is required!** The tests will run against an unauthenticated version of the app.

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run specific test file
```bash
npx playwright test tests/create-recipe-wizard.spec.ts
```

### Debug tests
```bash
npx playwright test --debug
```

## Viewing Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## CI/CD Integration

The Buildkite pipeline runs E2E tests only on the `main` branch. The test mode is automatically enabled via the webServer command in `playwright.config.ts`.

## How Test Mode Works

When `VITE_TEST_MODE=true` is set:
- The `ProtectedRoute` component bypasses authentication checks
- Protected routes are accessible without login
- No Firebase authentication is required

This allows E2E tests to focus on testing functionality rather than authentication flows.

## Troubleshooting

### Tests failing with "element not found"
- Make sure your dev server is running
- Verify the UI elements match the selectors in the test
- Check the Playwright trace viewer for more details

### Timeout errors
- Increase timeout in `playwright.config.ts` if needed
- Check network requests in Playwright trace viewer
- Ensure the dev server is responding quickly
