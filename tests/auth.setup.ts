// Setup project (see playwright.config.ts): once per run, signs in through the form and saves
// cookies + localStorage to playwright/.auth/user.json (gitignored). Chromium tests
// load that file, so they start signed in. Docs: https://playwright.dev/docs/auth
// How a run works: docs/learning/concepts.md, "Auth and storage state".
import path from 'path'; // Node: builds file paths
// Our test (Playwright's test + our fixtures), renamed `setup` so this reads as setup.
import { test as setup, expect } from './fixtures';

// __dirname is tests/, so '..' = repo root. Setup writes this file; storageState in
// playwright.config.ts reads it, so both must name the same path.
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup(
  'sign in as user@test.com',
  async ({ page, signInPage, dashboardPage }) => {
    await signInPage.goto();
    await signInPage.signIn('user@test.com', 'Password123');

    // Wait until sign-in has really finished (authToken set) before saving;
    // saving too early would store a signed-out state.
    await expect(page).toHaveURL('/html/dashboard.html');
    await expect(dashboardPage.heading).toBeVisible();

    // Writes the file (and its folders). Saves cookies + localStorage only:
    // sessionStorage (tp_username) is not saved.
    await page.context().storageState({ path: authFile });
  },
);
