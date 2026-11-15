// Navigation from the home page's Main navigation to the pages it links to.
// Each test: open home, act through a page object method (openSignIn...), then
// check the URL and the target page's heading, both in the spec.
import { test, expect } from '../../fixtures';

test.describe('Home navigation', () => {
  test('Login link opens the sign-in page', async ({
    page,
    homePage,
    signInPage,
  }) => {
    await homePage.goto();

    await homePage.openSignIn();

    await expect(page).toHaveURL('/html/signin.html');
    await expect(signInPage.heading).toBeVisible();
  });

  test('Sign-up link opens the create account page', async ({
    page,
    homePage,
    createAccountPage,
  }) => {
    await homePage.goto();

    await homePage.openCreateAccount();

    await expect(page).toHaveURL('/html/create-account.html');
    await expect(createAccountPage.heading).toBeVisible();
  });

  test('Task Board link opens the task board page', async ({
    page,
    homePage,
    taskBoardPage,
  }) => {
    await homePage.goto();

    await homePage.openTaskBoard();

    await expect(page).toHaveURL('/html/taskboard.html');
    await expect(taskBoardPage.heading).toBeVisible();
  });
});
