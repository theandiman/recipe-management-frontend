import { defineConfig, devices } from '@playwright/test';

/**
 * Returns true only when the runner is exclusively targeting the post-deploy
 * project — either via the npm lifecycle script or an explicit --project flag.
 *
 * We deliberately avoid a bare env-var check here: an env var alone would be
 * too broad and would disable the dev server even when running all projects
 * together, breaking the chromium project.
 */
function isPostDeployOnlyRun(): boolean {
  if (process.env.npm_lifecycle_event === 'test:post-deploy') return true;

  const args = process.argv.slice(2);
  const projects: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--project=')) {
      projects.push(...arg.slice('--project='.length).split(','));
    } else if ((arg === '--project' || arg === '-p') && args[i + 1] && !args[i + 1].startsWith('-')) {
      projects.push(...args[++i].split(','));
    }
  }
  return projects.length > 0 && projects.map((p) => p.trim()).every((p) => p === 'post-deploy');
}

const isPostDeploy = isPostDeployOnlyRun();

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
        baseURL: process.env.DEPLOYED_APP_URL || 'http://missing-deployed-app-url',
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
