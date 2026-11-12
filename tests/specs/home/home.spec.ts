// Navigation from the home page's Main navigation to the pages it links to.
// Each test: open home, act through a page object method (openSignIn...), then
// check the URL and the target page's heading, both in the spec.
import { test, expect } from '@playwright/test';

import { HomePage } from '../../pages/HomePage';
import { SignInPage } from '../../pages/SignInPage';
import { TaskBoardPage } from '../../pages/TaskBoardPage';
import { CreateAccountPage } from '../../pages/CreateAccountPage';

test.describe('Home navigation', () => {
  test('Login link opens the sign-in page', async ({ page }) => {
    const homePage = new HomePage(page);
    const signInPage = new SignInPage(page);

    await homePage.goto();

    await homePage.openSignIn();

    await expect(page).toHaveURL('/html/signin.html');
    await expect(signInPage.heading).toBeVisible();
  });

  test('Sign-up link opens the create account page', async ({ page }) => {
    const homePage = new HomePage(page);
    const createAccountPage = new CreateAccountPage(page);

    await homePage.goto();

    await homePage.openCreateAccount();

    await expect(page).toHaveURL('/html/create-account.html');
    await expect(createAccountPage.heading).toBeVisible();
  });

  test('Task Board link opens the task board page', async ({ page }) => {
    const homePage = new HomePage(page);
    const taskBoardPage = new TaskBoardPage(page);

    await homePage.goto();

    await homePage.openTaskBoard();

    await expect(page).toHaveURL('/html/taskboard.html');
    await expect(taskBoardPage.heading).toBeVisible();
  });
});
