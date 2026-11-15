// Fixtures: hand each test its page objects, so specs never write `new`.
//   ✘ const homePage = new HomePage(page);       (in every test, before Week 2)
//   ✔ test('...', async ({ homePage }) => { ... })
// A FIXTURE is a Playwright idea (not a keyword): something Playwright builds
// before a test and hands to it by name. `page` is Playwright's own; the five
// below are ours. Playwright builds only the ones a test asks for.
// Docs: https://playwright.dev/docs/test-fixtures
//
// Specs import from this file, not from '@playwright/test':
//   import { test, expect } from '../../fixtures';   (a folder path finds index.ts)

// Playwright's `test`, renamed `base` here because we export our own `test` below
// and one file can't have two things called `test`.
import { test as base } from '@playwright/test';
// Normal `import` (not `import type`): we RUN `new HomePage(...)` below.
import { HomePage } from '../pages/HomePage';
import { SignInPage } from '../pages/SignInPage';
import { TaskBoardPage } from '../pages/TaskBoardPage';
import { CreateAccountPage } from '../pages/CreateAccountPage';
import { DashboardPage } from '../pages/DashboardPage';

// `type` (TypeScript) gives a name to a shape; it never runs. `Fixtures` is our
// name for it. It lists the extra things a test can ask for, and what each holds:
// homePage holds a HomePage object, and so on. The PROPERTY names (homePage...)
// are the words specs write in `async ({ homePage }) =>`.
// It lets `npm run typecheck` catch mistakes, e.g.
//   ✘ homePage: async ({ page }, use) => { await use(new SignInPage(page)); }
//   ✔ homePage: async ({ page }, use) => { await use(new HomePage(page)); }
type Fixtures = {
  homePage: HomePage;
  signInPage: SignInPage;
  taskBoardPage: TaskBoardPage;
  createAccountPage: CreateAccountPage;
  dashboardPage: DashboardPage;
};

// base.extend(...) (Playwright) makes a NEW test that has everything the old one
// had (page, context...) plus our fixtures. <Fixtures> hands our type in (generics),
// so TypeScript knows `homePage` in a test is a HomePage.
export const test = base.extend<Fixtures>({
  // Each property holds a nameless function that WE write and PLAYWRIGHT calls,
  // before any test that asks for that name. Its inputs, filled by Playwright:
  //   { page } = from Playwright's object of fixtures, pick `page` (picked BY NAME,
  //              so it must be spelled `page`). Same tab as the test's `page`.
  //   use      = a function Playwright hands in (the name `use` is ours, the docs'
  //              convention). use(value) gives the value to the test and only
  //              finishes when the test has finished. Lines after it = cleanup
  //              (none needed here).
  homePage: async ({ page }, use) => {
    // new HomePage(page) creates the object; use(...) hands it to the test.
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

// Re-export Playwright's expect unchanged, so specs get test AND expect from here.
export { expect } from '@playwright/test';
