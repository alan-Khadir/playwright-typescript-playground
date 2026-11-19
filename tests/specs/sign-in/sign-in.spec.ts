// Tests for the Sign In screen. Every expect lives here; page objects only act.
// Line-by-line walkthrough: docs/learning/walkthroughs.md#sign-in-spec
// Docs: https://playwright.dev/docs/writing-tests
import { test, expect } from '../../fixtures';

test.describe('Sign in', { tag: '@regression' }, () => {
  // Start signed out: these tests sign in through the form themselves.
  test.use({ storageState: { cookies: [], origins: [] } });

  // Lists `page` because it checks the tab's URL directly; all three share one tab.
  test(
    'valid user reaches the dashboard',
    { tag: '@smoke' },
    async ({ page, signInPage, dashboardPage }) => {
      await signInPage.goto();
      await signInPage.signIn('user@test.com', 'Password123');

      // The URL proves the redirect; the heading proves the user sees the page.
      await expect(page).toHaveURL('/html/dashboard.html');
      await expect(dashboardPage.heading).toBeVisible();
    },
  );

  test('wrong password shows the error', async ({ signInPage }) => {
    await signInPage.goto();
    await signInPage.signIn('user@test.com', 'wrongpassword');

    await expect(signInPage.errorMessage).toBeVisible();
  });
});
