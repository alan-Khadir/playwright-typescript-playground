// Fixtures: hand each test its page objects by name, so specs never write `new`.
// Specs import { test, expect } from '../../fixtures', never from '@playwright/test'.
// Line-by-line walkthrough: docs/learning/walkthroughs.md#fixtures
// Docs: https://playwright.dev/docs/test-fixtures
import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SignInPage } from '../pages/SignInPage';
import { TaskBoardPage } from '../pages/TaskBoardPage';
import { CreateAccountPage } from '../pages/CreateAccountPage';
import { DashboardPage } from '../pages/DashboardPage';

/** Every fixture a test can ask for, and the object it holds. */
type Fixtures = {
  homePage: HomePage;
  signInPage: SignInPage;
  taskBoardPage: TaskBoardPage;
  createAccountPage: CreateAccountPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<Fixtures>({
  // Each fixture builds its page object with the test's tab and hands it over with use().
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },
  taskBoardPage: async ({ page }, use) => {
    await use(new TaskBoardPage(page));
  },
  createAccountPage: async ({ page }, use) => {
    await use(new CreateAccountPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
