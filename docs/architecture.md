# Architecture

How this framework is organised, and the rules every test follows. This file says WHAT we do; why it works is explained in [learning/concepts.md](learning/concepts.md), and our files are explained line by line in [learning/walkthroughs.md](learning/walkthroughs.md). Setup and commands: [setup-guide.md](setup-guide.md). Checks that enforce the rules: [README Guardrails](../README.md#guardrails).

## Folder structure

Folders are created when the first file needs them, so this grows week by week.

```
webapp/               the app under test. Never changed to make a test pass.
docs/                 setup-guide.md, architecture.md
  learning/           concepts.md (how things work), walkthroughs.md (our files, line by line)
  decisions/          one file per decision record, e.g. 001-week-1-tooling-and-workflow.md
tests/
  components/         parts used on many pages, included by page objects as a property (composition)
    NavBar.ts         the Main navigation: its links, the dark mode button, and their actions
  fixtures/index.ts   hands each test its page objects by name ({ homePage }); specs import test and expect from here
  specs/<app area>/   the tests and every expect, one folder per screen the tests start on
    sign-in/sign-in.spec.ts
    home/home.spec.ts
  pages/              one page object per screen: locators and actions, no expect
    SignInPage.ts  HomePage.ts  DashboardPage.ts  CreateAccountPage.ts  TaskBoardPage.ts
```

A page object is created the first time a test touches that screen, with only what that test uses (e.g. `CreateAccountPage` has just `heading` until Week 3). A component (`tests/components/`) is a part that appears on 2+ screens. `NavBar` was added in Week 2 Day 1: the Main navigation is on every page, and the plan asks for it then. Today only `HomePage` includes it; other page objects add `readonly navBar` when a test of theirs needs the nav.

## Rules we follow

Each rule links to the official page it comes from. Where we differ from the docs on purpose, it says why.

### Locators

User-facing locators first: `getByRole` → `getByLabel` → `getByText` → (`getByPlaceholder`, `getByAltText`, `getByTitle`) → `getByTestId` last. No CSS or XPath tied to page structure.
Source: [Locators](https://playwright.dev/docs/locators), [Best practices: locators](https://playwright.dev/docs/best-practices#use-locators).

```ts
// ✘ Wrong: tied to the HTML. Breaks if a developer renames the id; a user never sees it.
page.locator('#email');
// ✔ Right: finds the box the way a user does, by its label.
page.getByLabel('Email');
```

- `getByRole` for things you interact with (buttons, links, inputs); `getByText` for plain text (div, span, p).
- Form fields: `getByLabel`, as the Locators page recommends for form controls. It reads the same for every field, and it fails if the label is missing or no longer linked to the field.
- CSS only when no user-facing locator can exist. Our one case: the page's root element, `page.locator('html')` (`HomePage.htmlElement`), which has no role, label or text. ✘ `page.locator('.primary-nav button')` (a role and name exist) / ✔ `page.locator('html')`. Source: [Locators: CSS or XPath](https://playwright.dev/docs/locators#locate-by-css-or-xpath).
- Test IDs are stable but not user-facing: they still pass if the label is missing. Use them only when there is no stable text or role.

- `getByRole` searches the role the browser gives each element, not the HTML tag (e.g. an email input is a `textbox`; a `div` is `generic`, so use `getByText`). Full role table and how to find roles on any page: [concepts: ARIA and roles](learning/concepts.md#aria-roles-and-the-accessibility-tree-week-1-day-3). When the W3C table and the browser disagree, trust Playwright's page snapshot.

### Strict mode: one locator, one element

A locator used for an action or assertion must match exactly one element, or Playwright fails the test. Fix it by making the locator more specific (scope it inside a part of the page), not with `.first()` or `.nth()`.
Source: [Locators: strictness](https://playwright.dev/docs/locators#strictness).

```ts
// ✘ Wrong: picks whichever comes first. If the page changes, it may pick the wrong element.
await expect(
  page.getByText('Invalid email or password.').first(),
).toBeVisible();
// ✔ Right: scoped to the part of the page we mean, so only one element can match.
await expect(
  page.getByRole('main').getByText('Invalid email or password.'),
).toBeVisible();
```

### Assertions and waiting

Web-first assertions only: `await expect(locator).toBeVisible()` and friends retry until they pass or time out. No `waitForTimeout`, no manual `isVisible()` checks.
Source: [Assertions](https://playwright.dev/docs/test-assertions), [Auto-waiting](https://playwright.dev/docs/actionability), [Best practices: web-first assertions](https://playwright.dev/docs/best-practices#use-web-first-assertions).

```ts
// ✘ Wrong: a fixed sleep, then a one-off check that doesn't wait.
await page.waitForTimeout(3000);
expect(
  await page.getByRole('heading', { name: 'Choose a Topic' }).isVisible(),
).toBe(true);
// ✔ Right: retries until the heading is visible (up to 5 s).
await expect(
  page.getByRole('heading', { name: 'Choose a Topic' }),
).toBeVisible();
```

Use the matching web-first assertion, never a one-off read of the value:

| ✔ Use (retries)                                        | ✘ Not (checks once, flaky)                            |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `await expect(locator).toBeVisible()`                  | `expect(await locator.isVisible()).toBe(true)`        |
| `await expect(locator).toHaveText('Welcome')`          | `expect(await locator.textContent()).toBe('Welcome')` |
| `await expect(page).toHaveURL('/html/dashboard.html')` | `expect(page.url()).toContain('dashboard')`           |
| `await expect(locator).toHaveCount(3)`                 | `expect(await locator.count()).toBe(3)`               |
| `await expect(locator).toHaveValue('hello')`           | `expect(await locator.inputValue()).toBe('hello')`    |

Don't check what Playwright already checks before an action. Before `click()` or `fill()` it waits for the element to be visible, stable, enabled and not covered.
Source: [Auto-waiting](https://playwright.dev/docs/actionability).

```ts
// ✘ Wrong: the first line adds nothing; click() already waits for visible.
await expect(signInButton).toBeVisible();
await signInButton.click();
// ✔ Right
await signInButton.click();
```

Don't wait for "the network to go quiet". Wait for what the user sees.

```ts
// ✘ Wrong: discouraged in the docs; slow and unreliable.
await page.waitForLoadState('networkidle');
// ✔ Right: wait for the result the user expects.
await expect(page).toHaveURL('/html/dashboard.html');
```

#### Checking the URL

After an action that changes page (sign in, click a link), check the URL with `toHaveURL`, then check something the user sees on the new page.
Source: [toHaveURL](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-url), [Assertions](https://playwright.dev/docs/test-assertions).

- Give `expect` the tab (`page`), not a value read from it. Then it re-reads the URL until it matches, for up to 5 seconds.
- Use the path only. A string is joined to `baseURL` (`http://localhost:3000` in `playwright.config.ts`), so `'/html/dashboard.html'` means `http://localhost:3000/html/dashboard.html`.
- A string must match the **whole** URL, including any `?query`. Use a regular expression only when part of the URL changes from run to run (e.g. an id).
- The URL alone isn't proof: a blank or broken page can have the right address. Follow it with a check the user would see, e.g. the page heading.

```ts
// ✘ Wrong: page.url() reads the address ONCE (a plain string). No retry: fails if the redirect is slow.
expect(page.url()).toBe('http://localhost:3000/html/dashboard.html');
// ✔ Right: our pattern. Retries, exact path, then what the user sees.
await expect(page).toHaveURL('/html/dashboard.html');
await expect(dashboardPage.heading).toBeVisible();
```

More wrong/right pairs (hard-coded full URL, loose regex, `waitForURL` before `toHaveURL`): [concepts: Assertions with expect](learning/concepts.md#assertions-with-expect).

### Actions

Use the action made for the element. Source: [Actions](https://playwright.dev/docs/input).

| Element         | ✔ Use                                    | ✘ Not                                           |
| --------------- | ---------------------------------------- | ----------------------------------------------- |
| Text box        | `fill('text')` (clears first)            | `type()` (deprecated) or typing key by key      |
| Checkbox, radio | `check()` / `uncheck()` (safe to repeat) | `click()` (toggles, so a second call undoes it) |
| Dropdown        | `selectOption('value')`                  | clicking the options                            |
| File upload     | `setInputFiles('path')`                  | the operating system's file dialog              |

### Await everything

Every Playwright call returns a Promise. A missing `await` makes tests flaky. ESLint's `no-floating-promises` catches it.
Source: [Best practices: lint your tests](https://playwright.dev/docs/best-practices#lint-your-tests).

```ts
// ✘ Wrong
page.goto('/html/signin.html');
// ✔ Right
await page.goto('/html/signin.html');
```

### Independent tests

Every test runs alone, in any order, in parallel. No test relies on another test's state.
Source: [Best practices: make tests isolated](https://playwright.dev/docs/best-practices#make-tests-as-isolated-as-possible).

### Types

Strict TypeScript. No `any`. Explicit types on page objects, helpers and test data.
Source: [TypeScript: strict](https://www.typescriptlang.org/tsconfig/#strict).

```ts
// ✘ Wrong: `email` is silently `any`; tsc (strict) reports it.
async signIn(email, password) {}
// ✔ Right
async signIn(email: string, password: string): Promise<void> {}
```

### Page objects

- Page objects hold locators and actions only. Every `expect` lives in the spec.
- Specs get page objects from fixtures (`async ({ homePage }) => ...`), never with `new`. Every page object has a fixture in `tests/fixtures/index.ts`. See "Fixtures" below.
- Every user action goes through a page object method, even a single click (`homePage.navBar.openSignIn()`). Specs never call `click()` or `fill()` directly.
- Anything a spec needs to check is a `readonly` Locator property on the page object; the spec asserts on it with a web-first assertion. Specs hold no locators of their own.
- A page object stores the tab (`private readonly page: Page`) only if a method uses `this.page` later (e.g. `goto()`). Otherwise the constructor takes `page: Page` as a plain input.
- Composition over inheritance: no `BasePage` or `BaseTest`. A part shared by many pages is a component that the page object builds in its own constructor and exposes as a property:
  ```ts
  // ✘ class HomePage extends BasePage   (inheritance: every page gets everything)
  // ✔ HomePage has a NavBar             (composition: only the parts it really has)
  this.navBar = new NavBar(page); // in HomePage's constructor; spec: homePage.navBar.openSignIn()
  ```
  The page object builds the component itself (not passed in as a constructor input), so the fixture stays `new HomePage(page)`.
- No wrappers around Playwright's own API: no GENERIC helpers such as `clickElement(locator)` or custom wait, retry or log functions. A page-specific user action like `openSignIn()` is not a wrapper.
- At most three hops from a test to a locator: spec → page object (→ component) → Playwright, e.g. `homePage.navBar.darkModeButton`.

How a spec checks something the page object finds: a `readonly` Locator property on the page object, and a web-first assertion in the spec (`await expect(signInPage.errorMessage).toBeVisible()`). Not a method that returns the text (no retry), not an `expect` inside the page object (hides the check). The 4 options compared: [concepts](learning/concepts.md#how-a-spec-checks-something-that-a-page-object-finds-4-options-week-1-day-4).

Source: [Page object models](https://playwright.dev/docs/pom), Martin Fowler's [PageObject](https://martinfowler.com/bliki/PageObject.html) (no assertions in page objects).

### Fixtures

Every page object is a fixture in `tests/fixtures/index.ts`. A spec asks for what it uses, by name, and Playwright builds it before the test and throws it away after.

```ts
// ✘ Before (Week 1): every test builds its own page objects.
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';

test('Login link opens the sign-in page', async ({ page }) => {
  const homePage = new HomePage(page);
  // ...
});

// ✔ Now: the test names what it needs; the fixture builds it.
import { test, expect } from '../../fixtures';

test('Login link opens the sign-in page', async ({
  page,
  homePage,
  signInPage,
}) => {
  // ...
});
```

- Specs import `test` and `expect` from `../../fixtures`, never from `@playwright/test`.
- List exactly the names the test body uses. Add `page` only if the test uses it directly (e.g. `expect(page).toHaveURL(...)`).
- All fixtures in one test share one tab: Playwright builds `page` once per test and every fixture that asks for it gets the same one.
- A fixture only builds the object (`await use(new HomePage(page))`). Steps such as `goto()` stay in the test, because not every test starts on the same page.
- Not used: `beforeEach` with `let homePage` (reassignable, built even when unused, not shareable across files); `BaseTest` or `BasePage` classes (inheritance, see Page objects).

Source: [Fixtures](https://playwright.dev/docs/test-fixtures).

### Naming

| What                               | Pattern                                                               | Examples                                                                  |
| ---------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Open this page directly by its URL | `goto()` (one word, like Playwright's `page.goto()`)                  | `homePage.goto()`, `signInPage.goto()`                                    |
| Reach another page through the UI  | `open` + destination page object name without `Page`                  | `openSignIn()` → `SignInPage`, `openCreateAccount()`, `openTaskBoard()`   |
| Any other user action              | the user's verb                                                       | `signIn(email, password)`, `toggleDarkMode()`                             |
| Locator properties                 | what it is + kind of element; links use their text                    | `emailInput`, `signInButton`, `loginLink`, `darkModeButton`, `heading`    |
| Page object classes and files      | PascalCase + `Page`, file named the same                              | `CreateAccountPage` in `CreateAccountPage.ts`                             |
| Components (part of a screen)      | PascalCase, no `Page` (you can't open it), in `tests/components/`     | `NavBar` in `NavBar.ts`; property on the page object: `navBar`            |
| Methods                            | camelCase (small first letter)                                        | `toggleDarkMode()`, not `ToggleDarkMode()`                                |
| Test titles                        | what the user does + expected result, lowercase except on-screen text | `'Login link opens the sign-in page'`, `'wrong password shows the error'` |

Name the user's goal, not the mechanics:

```ts
// ✘ Wrong: describes the UI. Untrue if the link becomes a button or its text changes.
await homePage.clickLoginLink();
// ✔ Right: describes what the user wants.
await homePage.navBar.openSignIn();
```

### Where we differ from the docs on purpose

| Docs say                                                                                        | We do                   | Why                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [Test across all browsers](https://playwright.dev/docs/best-practices#test-across-all-browsers) | Chromium only (for now) | Fast feedback while the framework is built; Firefox and WebKit return in Week 9. WebKit also can't launch on Windows locally (libwebp.dll). |

## Official docs

The pages these rules come from. Check them before adding a new pattern, and read the release notes when upgrading Playwright.

- Every test: [Writing tests](https://playwright.dev/docs/writing-tests), [Locators](https://playwright.dev/docs/locators), [Assertions](https://playwright.dev/docs/test-assertions), [Auto-waiting](https://playwright.dev/docs/actionability), [Actions](https://playwright.dev/docs/input), [Best practices](https://playwright.dev/docs/best-practices), [Release notes](https://playwright.dev/docs/release-notes)
- Debugging: [UI mode](https://playwright.dev/docs/test-ui-mode), [Trace viewer](https://playwright.dev/docs/trace-viewer), [Debugging](https://playwright.dev/docs/debug)
- Framework: [Page object models](https://playwright.dev/docs/pom), [Fixtures](https://playwright.dev/docs/test-fixtures), [Authentication](https://playwright.dev/docs/auth), [Annotations and tags](https://playwright.dev/docs/test-annotations), [Retries](https://playwright.dev/docs/test-retries), [Parallelism](https://playwright.dev/docs/test-parallel)
- Later: [Mock APIs](https://playwright.dev/docs/mock), [API testing](https://playwright.dev/docs/api-testing), [Accessibility testing](https://playwright.dev/docs/accessibility-testing), [ARIA snapshots](https://playwright.dev/docs/aria-snapshots), [Visual comparisons](https://playwright.dev/docs/test-snapshots), [Emulation](https://playwright.dev/docs/emulation), [CI](https://playwright.dev/docs/ci)
- TypeScript: [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html), [tsconfig reference](https://www.typescriptlang.org/tsconfig/)
- Accessibility roles: W3C [ARIA in HTML](https://www.w3.org/TR/html-aria/) (which role each HTML tag gets; what `getByRole` searches). When it disagrees with the browser, trust Playwright's page snapshot.
