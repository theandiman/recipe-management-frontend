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

## Post-Deployment Multi-User Tests

These tests run against the **deployed** environment and require real Firebase credentials. They are tagged `@post-deploy` and live in `tests/post-deploy/`.

### Test files

| File | Issues | Description |
|------|--------|-------------|
| `tests/helpers/test-user-provisioner.ts` | #19 | Dynamic test-user creation/cleanup via Firebase Admin SDK |
| `tests/post-deploy/multi-user-api.spec.ts` | #21 | API-level multi-user CRUD, auth boundaries, share/follow/like |
| `tests/post-deploy/multi-user-frontend.spec.ts` | #20 | Browser-level multi-user flows + auth boundary checks |

### Required environment variables

| Variable | Description |
|----------|-------------|
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | JSON service account key (Firebase Admin) |
| `FIREBASE_WEB_API_KEY` | Firebase Web/REST API key |
| `MANAGEMENT_API_URL` | Deployed backend base URL (e.g. `https://api.example.com`) |
| `DEPLOYED_APP_URL` | Deployed frontend URL (e.g. `https://recipe-mgmt-dev.web.app`) |

### Running post-deploy tests

```bash
export FIREBASE_ADMIN_SERVICE_ACCOUNT='{"type":"service_account",...}'
export FIREBASE_WEB_API_KEY=AIza...
export MANAGEMENT_API_URL=https://your-api.run.app
export DEPLOYED_APP_URL=https://recipe-mgmt-dev.web.app

npm run test:post-deploy
```

Tests **skip gracefully** when required env vars are absent, so local development is unaffected.

📖 **Full documentation:** [docs/MULTI_USER_POST_DEPLOY_TESTING.md](../docs/MULTI_USER_POST_DEPLOY_TESTING.md) — architecture, permissions, allowlist bypass, cleanup strategy, extending tests, and troubleshooting.

### How the test-user harness works

`TestUserProvisioner` uses the Firebase Admin SDK to create uniquely-named users per test run (bypassing the email-allowlist blocking function). After each test suite, `cleanup()` deletes all provisioned users. Firebase ID tokens are obtained via the REST `signInWithPassword` endpoint.

## Troubleshooting

### Tests failing with "element not found"
- Make sure your dev server is running
- Verify the UI elements match the selectors in the test
- Check the Playwright trace viewer for more details

### Timeout errors
- Increase timeout in `playwright.config.ts` if needed
- Check network requests in Playwright trace viewer
- Ensure the dev server is responding quickly
