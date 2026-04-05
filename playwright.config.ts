import { defineConfig, devices } from '@playwright/test';

// Detect whether only the post-deploy project is being run, either via the
// npm lifecycle script name or by explicit --project=post-deploy CLI args.
const lifecycleIsPostDeploy = process.env.npm_lifecycle_event === 'test:post-deploy';

const cliArgs = process.argv.slice(2);
const selectedProjects: string[] = [];
for (let i = 0; i < cliArgs.length; i++) {
  const arg = cliArgs[i];
  if (arg.startsWith('--project=')) {
    selectedProjects.push(...arg.slice('--project='.length).split(','));
  } else if ((arg === '--project' || arg === '-p') && cliArgs[i + 1] && !cliArgs[i + 1].startsWith('-')) {
    selectedProjects.push(...cliArgs[++i].split(','));
  }
}
const cliIsPostDeployOnly =
  selectedProjects.length > 0 &&
  selectedProjects.map((p) => p.trim()).every((p) => p === 'post-deploy');

const isPostDeploy = !!process.env.RUN_POST_DEPLOY_TESTS || lifecycleIsPostDeploy || cliIsPostDeployOnly;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI 
    ? [
        ['html', { open: 'never' }],
        ['list'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        // Buildkite Test Engine for test analytics
        ...(process.env.BUILDKITE ? [['buildkite-test-collector/playwright/reporter']] : [])
      ]
    : [['html', { open: 'on-failure' }]],
  timeout: 30000, // 30 seconds per test
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    launchOptions: {
      headless: true, // Always run headless (especially in CI)
    },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // ── Local dev / CI unit-like tests (with local dev server) ──────────────
    {
      name: 'chromium',
      testIgnore: ['**/post-deploy/**'],
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Post-deployment tests (no local server needed) ───────────────────────
    {
      name: 'post-deploy',
      testMatch: ['**/post-deploy/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.DEPLOYED_APP_URL,
      },
    },
  ],

  // Only start the dev server for non-post-deploy runs
  webServer: isPostDeploy ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for server to start
    stdout: 'pipe', // Suppress server logs in CI
    stderr: 'pipe',
    env: {
      VITE_TEST_MODE: 'true',
    },
  },
});
