# Architecture

How this framework is organised, and the rules every test follows. Setup and commands: [setup-guide.md](setup-guide.md). Checks that enforce the rules: [README Guardrails](../README.md#guardrails).

## Folder structure

Folders are created when the first file needs them, so this grows week by week.

```
webapp/               the app under test. Never changed to make a test pass.
docs/                 setup-guide.md, architecture.md
  decisions/          one file per decision record, e.g. 001-week-1-tooling-and-workflow.md
tests/
  specs/<app area>/   the tests and every expect, one folder per screen the tests start on
    sign-in/sign-in.spec.ts
    home/home.spec.ts
  pages/              one page object per screen: locators and actions, no expect
    SignInPage.ts  HomePage.ts  DashboardPage.ts  CreateAccountPage.ts  TaskBoardPage.ts
```

A page object is created the first time a test touches that screen, with only what that test uses (e.g. `CreateAccountPage` has just `heading` until Week 3). `tests/components/` is added when a part of the page (e.g. the Main navigation) is used by page objects for 2+ screens.

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
- Test IDs are stable but not user-facing: they still pass if the label is missing. Use them only when there is no stable text or role.

#### Which elements `getByRole` can find

`getByRole` searches the role the browser gives each element, not the HTML tag. Full mapping: W3C [ARIA in HTML](https://www.w3.org/TR/html-aria/). Check any element in Chrome DevTools → Elements → **Accessibility** tab (Role, Name). When the W3C table and the browser disagree, trust Playwright's page snapshot (in `test-results/<test>/error-context.md` after a failure).

| HTML                                            | Role                              | Locator to use                                       |
| ----------------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `button`, `input type="submit"` / `"button"`    | button                            | `getByRole('button', { name: 'Sign In' })`           |
| `a` with `href`                                 | link                              | `getByRole('link', { name: 'Login' })`               |
| `h1` to `h6`                                    | heading                           | `getByRole('heading', { name: 'Choose a Topic' })`   |
| `input type="text"` / `"email"`, `textarea`     | textbox                           | `getByLabel('Email')` (form fields: always by label) |
| `input type="password"`                         | textbox in Playwright (W3C: none) | `getByLabel('Password')`                             |
| `input type="checkbox"` / `"radio"` / `"range"` | checkbox / radio / slider         | `getByRole(...)` or `getByLabel(...)`                |
| `select`                                        | combobox                          | `getByLabel(...)`, act with `selectOption()`         |
| `img` with `alt`                                | img                               | `getByRole('img', { name })` or `getByAltText`       |
| `main`, `nav`                                   | main, navigation                  | for scoping: `getByRole('main').getBy...`            |
| `form` with no name                             | none in Playwright                | `getByRole('form')` finds it only with `aria-label`  |
| `div`, `span`, `a` without `href`               | generic (no useful role)          | `getByText(...)`                                     |

- `role="..."` on an element overrides the tag (e.g. `div role="alert"` is an alert).
- `aria-label` gives a name, not a role. `aria-live` gives neither: the sign-in error `div` has `aria-live="polite"` and is still generic, so we use `getByText`.

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
// ✔ Right: our pattern. Retries, exact path, then what the user sees.
await expect(page).toHaveURL('/html/dashboard.html');
await expect(dashboardPage.heading).toBeVisible();

// ✘ Wrong: page.url() reads the address ONCE and returns a plain string. No retry: fails if the redirect is slow.
expect(page.url()).toBe('http://localhost:3000/html/dashboard.html');
// ✔ Right
await expect(page).toHaveURL('/html/dashboard.html');

// ✘ Wrong: page.url without () is the method itself, and toHaveURL only works on a Page.
// npm run typecheck flags it.
await expect(page.url).toHaveURL('/html/dashboard.html');
// ✔ Right
await expect(page).toHaveURL('/html/dashboard.html');

// ✘ Wrong: the full address hard-coded. Breaks when baseURL changes (another port, a test server).
await expect(page).toHaveURL('http://localhost:3000/html/dashboard.html');
// ✔ Right: path only; baseURL is added for you.
await expect(page).toHaveURL('/html/dashboard.html');

// ✘ Wrong: too loose. Also passes on /html/dashboard-help.html or /html/signin.html?next=dashboard.
await expect(page).toHaveURL(/dashboard/);
// ✔ Right: exact path when the URL is fixed.
await expect(page).toHaveURL('/html/dashboard.html');
// ✔ Right: a regular expression only for a part that changes, e.g. an id.
// (Made-up URL: our app has no changing URLs so far.)
await expect(page).toHaveURL(/\/html\/task\.html\?id=\d+$/);

// ✘ Wrong: waitForURL then toHaveURL. The wait adds nothing; toHaveURL already waits.
await page.waitForURL('/html/dashboard.html');
await expect(page).toHaveURL('/html/dashboard.html');
// ✔ Right
await expect(page).toHaveURL('/html/dashboard.html');
```

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
- Every user action goes through a page object method, even a single click (`homePage.openSignIn()`). Specs never call `click()` or `fill()` directly.
- Anything a spec needs to check is a `readonly` Locator property on the page object; the spec asserts on it with a web-first assertion. Specs hold no locators of their own.
- A page object stores the tab (`private readonly page: Page`) only if a method uses `this.page` later (e.g. `goto()`). Otherwise the constructor takes `page: Page` as a plain input.
- Composition over inheritance: no `BasePage` or `BaseTest`.
- No wrappers around Playwright's own API: no GENERIC helpers such as `clickElement(locator)` or custom wait, retry or log functions. A page-specific user action like `openSignIn()` is not a wrapper.
- At most three hops from a test to a locator: spec → page object → Playwright.

How a spec checks something the page object finds (example: the sign-in error):

| Option                                                                                               | Verdict      | Why                                                                                                                               |
| ---------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1. Method returns the text; spec does `expect(text).toBe(...)`                                       | ✘ Rejected   | Reads the text once, no retry: flaky.                                                                                             |
| 2. `expect` inside the page object (`await signInPage.expectErrorVisible()`)                         | ✘ Not here   | Retries, but hides the check from the spec and breaks "every expect in the spec".                                                 |
| 3. Method returns the Locator (`getErrorMessage(): Locator`)                                         | ✘ Unneeded   | Same as 4 with an extra method that does nothing.                                                                                 |
| 4. `readonly errorMessage: Locator`; spec does `await expect(signInPage.errorMessage).toBeVisible()` | ✔ We do this | Retries (web-first), locator in one place, check visible in the spec. Same as the [POM](https://playwright.dev/docs/pom) example. |

```ts
// ✘ Wrong: reads the text once. If the error isn't shown yet, '' !== expected -> fails, no retry.
expect(await signInPage.getErrorText()).toBe('Invalid email or password.');
// ✔ Right: expect gets the Locator, so toBeVisible() re-checks for up to 5 seconds.
await expect(signInPage.errorMessage).toBeVisible();
```

`await` never retries; it only waits for a Promise to finish. The retrying comes from the web-first assertion, and only when `expect` is given a Locator (or the page). Sources: [Assertions](https://playwright.dev/docs/test-assertions), [Best practices: web-first assertions](https://playwright.dev/docs/best-practices#use-web-first-assertions), Martin Fowler's [PageObject](https://martinfowler.com/bliki/PageObject.html) (no assertions in page objects).

Source: [Page object models](https://playwright.dev/docs/pom).

### Naming

| What                               | Pattern                                                               | Examples                                                                  |
| ---------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Open this page directly by its URL | `goto()` (one word, like Playwright's `page.goto()`)                  | `homePage.goto()`, `signInPage.goto()`                                    |
| Reach another page through the UI  | `open` + destination page object name without `Page`                  | `openSignIn()` → `SignInPage`, `openCreateAccount()`, `openTaskBoard()`   |
| Any other user action              | the user's verb                                                       | `signIn(email, password)`                                                 |
| Locator properties                 | what it is + kind of element; links use their text                    | `emailInput`, `signInButton`, `loginLink`, `errorMessage`, `heading`      |
| Page object classes and files      | PascalCase + `Page`, file named the same                              | `CreateAccountPage` in `CreateAccountPage.ts`                             |
| Test titles                        | what the user does + expected result, lowercase except on-screen text | `'Login link opens the sign-in page'`, `'wrong password shows the error'` |

Name the user's goal, not the mechanics:

```ts
// ✘ Wrong: describes the UI. Untrue if the link becomes a button or its text changes.
await homePage.clickLoginLink();
// ✔ Right: describes what the user wants.
await homePage.openSignIn();
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
