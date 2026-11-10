import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
/* Not used yet: dotenv is added in Week 2, when we move settings into a .env file. */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    /* On: tests write paths only, e.g. page.goto('/html/signin.html'). Matches webServer below. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* Off: Chromium only on every run, for fast feedback (plan, Week 1 Day 2).
       All browsers come back as a nightly run in Week 9. WebKit also can't launch
       on Windows (libwebp.dll), see setup guide Troubleshooting. */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    /* Not used yet: mobile testing is in Week 10. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    /* Not in the plan: Playwright's own Chromium covers Chrome and Edge behaviour. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  /* On: Playwright starts the app, waits until it answers, runs the tests, then stops it. */
  webServer: {
    /* Our app is static files served by serve (dev dependency), not `npm run start`.
       --listen 3000: the port. --no-port-switching: fail if 3000 is busy instead of
       quietly using another port. --no-clipboard: avoids serve's clipboard error. */
    command:
      'npx serve webapp --listen 3000 --no-port-switching --no-clipboard',
    /* Wait until the app answers here before running tests. */
    url: 'http://localhost:3000',
    /* Locally, reuse a server already running; on CI always start a fresh one. */
    reuseExistingServer: !process.env.CI,
  },
});
