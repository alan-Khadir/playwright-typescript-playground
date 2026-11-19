// Tests that start on the home page.
// Home navigation: open home, act through the NavBar (homePage.navBar.openSignIn()...),
// then check the URL and the target page's heading, both in the spec.
// Dark mode: the toggle adds class "dark-mode" to <html>; checked before and after.
import { test, expect } from '../../fixtures';

test.describe('Home navigation', { tag: '@regression' }, () => {
  test('Login link opens the sign-in page', async ({
    page,
    homePage,
    signInPage,
  }) => {
    await homePage.goto();

    await homePage.navBar.openSignIn();

    await expect(page).toHaveURL('/html/signin.html');
    await expect(signInPage.heading).toBeVisible();
  });

  test('Sign-up link opens the create account page', async ({
    page,
    homePage,
    createAccountPage,
  }) => {
    await homePage.goto();

    await homePage.navBar.openCreateAccount();

    await expect(page).toHaveURL('/html/create-account.html');
    await expect(createAccountPage.heading).toBeVisible();
  });

  test('Task Board link opens the task board page', async ({
    page,
    homePage,
    taskBoardPage,
  }) => {
    await homePage.goto();

    await homePage.navBar.openTaskBoard();

    await expect(page).toHaveURL('/html/taskboard.html');
    await expect(taskBoardPage.heading).toBeVisible();
  });
});

test.describe('Dark mode', { tag: '@regression' }, () => {
  test('Toggle dark mode button switches the page to dark mode', async ({
    homePage,
  }) => {
    await homePage.goto();

    // Start state first: proves the click is what adds the class.
    // If the page started dark and the button did nothing, the last check alone would still pass.
    await expect(homePage.htmlElement).not.toHaveClass('dark-mode');

    await homePage.navBar.toggleDarkMode();

    // A string must match the WHOLE class attribute: exactly "dark-mode".
    await expect(homePage.htmlElement).toHaveClass('dark-mode');
  });
});
