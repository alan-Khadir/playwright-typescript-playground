// Tests for the Sign In screen.
// Rule: the spec says WHAT is tested and holds every expect (every check).
// The page object (SignInPage) only DOES things: find elements, fill, click.
// Docs: https://playwright.dev/docs/writing-tests
//       https://playwright.dev/docs/test-assertions

// `test` and `expect` come from OUR fixtures file (tests/fixtures/index.ts), not
// straight from Playwright:
//   test(...)   -> defines one test. It's Playwright's test PLUS our page objects,
//                  so a test can ask for { signInPage } instead of building one.
//   expect(...) -> Playwright's check, passed through unchanged: "this must be true,
//                  or the test fails"
// Both are FUNCTIONS (called on their own, no dot in front). We RUN them, so they
// need a normal `import`.
// The path starts from THIS file's folder and `..` means "up one folder":
//   tests/specs/sign-in/  --..-->  tests/specs/  --..-->  tests/  -->  fixtures/
// A folder path finds the folder's index.ts by itself (no .ts at the end either).
// Page objects are no longer imported here: the fixtures file does that.
import { test, expect } from '../../fixtures';

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
  // test('name', async ({ ... }) => { ... }) defines ONE test: a name + the steps.
  //
  // The name states the expected result, so a failure reads like a bug report:
  //   ✘ Sign in › valid user reaches the dashboard
  //
  // `async ({ page, signInPage, dashboardPage }) => { ... }` is the steps, as an
  // arrow function with no name (we hand it to test(), and Playwright runs it):
  //   - `async`: the steps use `await`, so the function must be async.
  //   - `({ ... })`: the function's input. Playwright passes in an object of
  //     ready-made things (FIXTURES: built before the test, thrown away after);
  //     the braces pick the ones this test uses, BY NAME:
  //       page          -> Playwright's: a brand-new tab in a brand-new browser
  //                        context (no cookies or localStorage from other tests)
  //       signInPage    -> ours (tests/fixtures/index.ts): a SignInPage built
  //       dashboardPage    with this test's tab, and a DashboardPage likewise
  //     All three share ONE tab: Playwright builds `page` once per test and every
  //     fixture that asks for it gets the same one.
  //   - List exactly the names the steps use: this test needs `page` for
  //     expect(page); the next test only uses signInPage, so it lists only that.
  test('valid user reaches the dashboard', async ({
    page,
    signInPage,
    dashboardPage,
  }) => {
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

  test('wrong password shows the error', async ({ signInPage }) => {
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
