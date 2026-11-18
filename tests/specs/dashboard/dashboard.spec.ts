// Tests for the dashboard's auth guard: signed out is sent to sign in; signed in
// sees the topic grid. Signed in comes from storage state (tests/auth.setup.ts).
import { test, expect } from '../../fixtures';

test.describe('Dashboard, signed out', () => {
  // Start signed out: empty storage state instead of playwright/.auth/user.json.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signed-out user is sent to sign in', async ({
    page,
    dashboardPage,
    signInPage,
  }) => {
    await dashboardPage.goto();

    // A string must match the whole URL, query included.
    await expect(page).toHaveURL('/html/signin.html?redirect=dashboard');
    await expect(signInPage.heading).toBeVisible();
  });
});

test.describe('Dashboard, signed in', () => {
  test('signed-in user sees the topic grid', async ({ dashboardPage }) => {
    // Storage state signs the browser in, but the tab starts blank: open the page first.
    await dashboardPage.goto();

    await expect(dashboardPage.heading).toBeVisible();
    // 4 cards per page (the grid paginates the 10 topics).
    await expect(dashboardPage.topicCards).toHaveCount(4);
  });
});
