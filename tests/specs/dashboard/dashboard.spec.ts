// Tests for the dashboard: the auth guard (signed out is sent to sign in), the topic
// grid, search and clear, and opening a topic (loader, then the topic).
// Signed in comes from storage state (tests/auth.setup.ts).
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

  test('searching filters the grid to matching topics', async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();

    // Grid loaded first, so a drop to 1 proves the search changed it.
    await expect(dashboardPage.topicCards).toHaveCount(4);

    // Part of a word, lower case: what users type.
    await dashboardPage.searchTopics('space');

    // An array checks the exact number of titles and each title's exact text.
    await expect(dashboardPage.topicTitles).toHaveText(['Space Exploration']);
  });

  test('clearing the search shows all topics again', async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();

    await expect(dashboardPage.topicCards).toHaveCount(4);

    await dashboardPage.searchTopics('space');
    await expect(dashboardPage.topicCards).toHaveCount(1);

    // Reset means both: the search box is empty and all cards are back.
    await dashboardPage.clearSearch();
    await expect(dashboardPage.searchTopicsInput).toBeEmpty();
    await expect(dashboardPage.topicCards).toHaveCount(4);
  });

  test('opening a topic shows a loader, then the topic', async ({
    dashboardPage,
    topicLayout,
  }) => {
    await dashboardPage.goto();

    await dashboardPage.openTopic('Space Exploration');

    // No fixed waits: each assertion re-checks until true (5 s limit). toBeHidden
    // moves on as soon as the 1.2 s loader goes, and fails if it never does.
    await expect(topicLayout.loadingSpinner).toBeVisible();
    await expect(topicLayout.loadingSpinner).toBeHidden();
    // The title proves we landed on the topic we clicked.
    await expect(topicLayout.heading).toHaveText('Space Exploration');
  });
});
