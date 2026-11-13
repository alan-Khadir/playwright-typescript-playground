// Tests for the Sign In screen.
// Rule: the spec says WHAT is tested and holds every expect (every check).
// The page object (SignInPage) only DOES things: find elements, fill, click.
// Docs: https://playwright.dev/docs/writing-tests
//       https://playwright.dev/docs/test-assertions

// `test` and `expect` are FUNCTIONS from Playwright. A function is a set of steps you can run,
// like a method but not inside a class. We RUN them, so they need a normal `import`:
//   test(...)   -> defines one test
//   expect(...) -> a check: "this must be true, or the test fails"
import { test, expect } from '@playwright/test';
// Our page object. The path starts from THIS file's folder and `..` means "up one folder":
//   tests/specs/sign-in/  --..-->  tests/specs/  --..-->  tests/  -->  pages/SignInPage
// (No .ts at the end: TypeScript finds SignInPage.ts by itself.)
import { SignInPage } from '../../pages/SignInPage';
import { DashboardPage } from '../../pages/DashboardPage';

// test.describe('Sign in', () => { ... }) groups related tests under one name.
// The HTML report then shows each test as:
//   Sign in › valid user reaches the dashboard
//   Sign in › wrong password shows the error      (the next test goes inside this group too)
//
// `() => { ... }` is an ARROW FUNCTION: a function with no name, written inline.
//   ()      -> it takes no inputs
//   =>      -> "runs these steps:"
//   { ... } -> the steps (here: the tests in this group)
// We hand it to test.describe, and Playwright runs it to find the tests inside.
test.describe('Sign in', () => {
  // test('name', async ({ page }) => { ... }) defines ONE test: a name + the steps.
  //
  // The name states the expected result, so a failure reads like a bug report:
  //   ✘ Sign in › valid user reaches the dashboard
  //
  // `async ({ page }) => { ... }` is the steps, as an arrow function:
  //   - `async`: the steps use `await`, so the function must be async.
  //   - `({ page })`: the function's input. Playwright passes in a set of ready-made
  //     things; `{ page }` means "from that set, I want `page`".
  //     `page` is a brand-new browser tab in a brand-new browser context
  //     (no cookies or localStorage left over from other tests).
  //     This is a FIXTURE: something Playwright creates before the test and
  //     throws away after it. It's why each test can run alone, in any order.
  test('valid user reaches the dashboard', async ({ page }) => {
    // `const` = give a value a name, and that name can never be given a new value.
    // Example of a MISTAKE `npm run typecheck` would catch, if a later line in this test did:
    //   const signInPage = new SignInPage(page);   // first line: OK
    //   signInPage = new SignInPage(page);         // later line: give it a new value
    // `npm run typecheck` reports: Cannot assign to 'signInPage' because it is a constant.
    // `new SignInPage(page)` = build this test's own SignInPage object, using this test's
    // tab. This runs the constructor in SignInPage.ts, which sets the five locators.
    const signInPage = new SignInPage(page);
    const dashboardPage = new DashboardPage(page);

    // The user's steps, in order. Each method returns a Promise, so each is awaited:
    // finish this step before starting the next.
    await signInPage.goto(); // open /html/signin.html
    await signInPage.signIn('user@test.com', 'Password123'); // fill both fields, click Sign In

    // CHECK 1: the browser moved to the dashboard page.
    // expect(page) = check something about the whole tab. toHaveURL = its address.
    // '/html/dashboard.html' is added to baseURL, so this expects exactly:
    //   http://localhost:3000/html/dashboard.html
    // It keeps re-checking for up to 5 seconds (the redirect after clicking takes a
    // moment) and only fails if the address never matches. No manual waits needed.
    // ✘ expect(page.url()).toBe('...') reads the address ONCE (a plain string): no retry.
    // ✔ Give expect the tab (page). More ✘/✔: docs/architecture.md, "Checking the URL".
    await expect(page).toHaveURL('/html/dashboard.html');

    // CHECK 2: the user can actually SEE the dashboard.
    // A correct address with a blank or broken page would still pass CHECK 1.
    // expect(locator).toBeVisible() = keep re-checking (up to 5 seconds) until this
    // element is on the screen and not hidden; fail if it never is.
    // The heading on the page reads "🧪 Choose a Topic". `name` matches part of the
    // text by default, so 'Choose a Topic' finds it without typing the emoji.
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('wrong password shows the error', async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.goto();
    // A wrong password, so the app should refuse to sign in.
    // signIn() is reused: the values come from the test, not the page object.
    await signInPage.signIn('user@test.com', 'wrongpassword');

    // CHECK: the error message is shown.
    // `await` itself never retries: it only waits for one Promise to finish.
    // The retrying comes from toBeVisible(), because expect() was given a
    // LOCATOR (signInPage.errorMessage), which it can search for again and again
    // for up to 5 seconds. https://playwright.dev/docs/test-assertions
    await expect(signInPage.errorMessage).toBeVisible();
  });
});
