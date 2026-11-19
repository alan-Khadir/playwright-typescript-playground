# Walkthroughs

Line-by-line explanations of real files in this repo. Each walkthrough copies the code and explains it underneath, so you can read it here without switching to the file.

- Labels: **[JS]** JavaScript, **[TS]** TypeScript only (types, removed before the code runs), **[PW]** Playwright, **[OURS]** a name we chose.
- Concepts used here are explained in full in [concepts.md](concepts.md). This file shows them in our code.
- Each walkthrough says which week it matches. When a file changes a lot, its walkthrough is updated in the same commit.

Contents:

- [SignInPage](#signinpage) (`tests/pages/SignInPage.ts`)
- [Sign-in spec](#sign-in-spec) (`tests/specs/sign-in/sign-in.spec.ts`)
- [Fixtures](#fixtures) (`tests/fixtures/index.ts`)
- [NavBar and the dark mode test](#navbar-and-the-dark-mode-test) (`tests/components/NavBar.ts`, `tests/pages/HomePage.ts`, `tests/specs/home/home.spec.ts`) (Week 2 Day 1)
- [Auth setup and the dashboard tests](#auth-setup-and-the-dashboard-tests) (`tests/auth.setup.ts`, `playwright.config.ts`, `tests/pages/DashboardPage.ts`, `tests/specs/dashboard/dashboard.spec.ts`) (Week 2 Day 2)
- [Dashboard search and TopicLayout](#dashboard-search-and-topiclayout-week-2-day-3) (`tests/pages/DashboardPage.ts`, `tests/components/TopicLayout.ts`, `tests/fixtures/index.ts`, `tests/specs/dashboard/dashboard.spec.ts`) (Week 2 Day 3)
- [Tags and BASE_URL](#tags-and-base_url-week-2-day-3-part-2) (`playwright.config.ts`, `.env.example`, the three specs) (Week 2 Day 3, part 2)

---

## SignInPage

**File:** `tests/pages/SignInPage.ts` (as of Week 2 Day 1)

**What it does:** everything a test needs to use the Sign In screen (`/html/signin.html`): how to find its elements, and the actions a user takes there (open the page, sign in).

**Why it exists:** tests read like user steps (`await signInPage.signIn('user@test.com', 'Password123')`), and when the screen changes, one line here changes instead of every test. Example: if the button is renamed from "Sign In" to "Log in", only the `signInButton` line changes; every test that calls `signIn()` keeps working.

**Rule:** page objects DO things; they never check things. No `expect` here. Docs: [Page object models](https://playwright.dev/docs/pom).

### Imports

```ts
import type { Locator, Page } from '@playwright/test';
```

- `import ... from '@playwright/test'` [JS]: bring names in from the Playwright package.
- `type` [TS]: these names are only used as **type labels** (after a colon), never run. The line is deleted before the test runs.
- `Page` [PW]: the type of a browser tab. `Locator` [PW]: the type of "a way to find an element".
- Why `import type` and not `import`: in this file `Page` and `Locator` only appear after a colon (`readonly emailInput: Locator`, `page: Page`). Compare the spec, which RUNS `test(...)` and `expect(...)`, so it uses a normal `import`. See [concepts: import and import type](concepts.md#import-export-and-import-type).

### The class and its properties

```ts
export class SignInPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;
  readonly heading: Locator;
```

- `export` [JS]: other files may use this class. Without it, the fixtures file's `import { SignInPage } from '../pages/SignInPage'` fails: `Module ... has no exported member 'SignInPage'`.
- `class SignInPage` [JS]: a blueprint. The `signInPage` fixture builds one object from it for each test that asks for it (`new SignInPage(page)`), so two tests never share anything.
- Five **properties** [JS], each holding a Locator:
  - `readonly` [TS]: set once in the constructor, then never replaced. `signInPage.emailInput = page.getByLabel('Name')` in a spec makes `npm run typecheck` report: `Cannot assign to 'emailInput' because it is a read-only property.`
  - No `private`, so a spec can read them: `await expect(signInPage.errorMessage).toBeVisible()`.
  - `: Locator` [TS]: this property must hold a Locator. `this.emailInput = 'hello'` makes `npm run typecheck` report: `Type 'string' is not assignable to type 'Locator'.`
- Why `errorMessage` is a **property, not a method that returns the text**: a spec can then use a web-first assertion that retries. Full comparison of the 4 options: [concepts: how a spec checks what a page object finds](concepts.md#how-a-spec-checks-something-that-a-page-object-finds-4-options-week-1-day-4).

  ```ts
  // ✘ Wrong: reads the text once. If the error isn't shown yet, it reads '' and fails. No retry = flaky.
  expect(await signInPage.getErrorText()).toBe('Invalid email or password.');
  // ✔ Right: expect gets the Locator, so toBeVisible() re-checks for up to 5 seconds.
  await expect(signInPage.errorMessage).toBeVisible();
  ```

### The constructor

```ts
  constructor(private readonly page: Page) {
```

- `constructor` [JS]: setup code that runs once, when `new SignInPage(page)` runs (in the `signInPage` fixture, before the test).
- `private readonly page: Page` is a **parameter property** [TS], a shortcut for four things:
  1. take one input, a browser tab, typed `Page`;
  2. store it as `this.page`, so methods can use it later;
  3. `private`: only code inside this class can use it. In a spec, `signInPage.page.goto('/')` makes `npm run typecheck` report: `Property 'page' is private and only accessible within class 'SignInPage'.` Specs use our methods instead;
  4. `readonly`: it can't be replaced with another tab.
- Why store it at all: `goto()` uses `this.page` after the constructor has finished. A page object whose methods never use `this.page` takes `constructor(page: Page)` instead (see `DashboardPage`).

```ts
this.emailInput = page.getByLabel('Email');
```

- Saves HOW to find the element. Nothing is searched yet: Playwright looks when `fill()` or `click()` runs.
- `getByLabel('Email')` [PW]: the input field whose label says "Email". The HTML links them: `<label for="email">Email</label>` + `<input id="email">` (`for` matches `id`). It returns the **field**, not the label.

```ts
this.passwordInput = page.getByLabel('Password');
```

- Same for Password. `getByRole('textbox', { name: 'Password' })` would also work (Playwright treats a password input as a textbox, although the W3C table says "no role"), but `getByLabel` is the recommended locator for form fields and matches the Email line. See [concepts: ARIA and roles](concepts.md#aria-roles-and-the-accessibility-tree-week-1-day-3).

```ts
this.signInButton = page.getByRole('button', { name: 'Sign In' });
```

- `getByRole` [PW]: the element a screen reader announces as a "button" called "Sign In".
- ✘ `getByText('Sign In')` would also match the `<h1>Sign In</h1>` heading: 2 matches = strict mode error. ✔ `getByRole` matches only the button, and checks it really is one.

```ts
this.errorMessage = page
  .getByRole('main')
  .getByText('Invalid email or password.');
```

- The error is a `<div>` with no role (generic; `aria-live="polite"` adds no role) and it isn't a form field, so `getByRole` and `getByLabel` can't find it. Next in the priority list: `getByText`, for plain text. [Locate by text](https://playwright.dev/docs/locators#locate-by-text)
- **Strict mode:** the app shows this text twice: under the form AND in a toast (role alert) in the corner.
  - ✘ `page.getByText('Invalid email or password.')` → `Error: strict mode violation: ... resolved to 2 elements`.
  - ✘ `.first()` passes, but picks whichever comes first today; if the page changes it silently checks the toast.
  - ✔ Scope it: `page.getByRole('main')` is the `<main>` area. Calling `.getByText()` on it searches only inside `main`. The toast is outside `main`, so there is exactly 1 match. [Strictness](https://playwright.dev/docs/locators#strictness), [Matching inside a locator](https://playwright.dev/docs/locators#matching-inside-a-locator)
- This is **chaining**: one locator inside another.

```ts
    this.heading = page.getByRole('heading', { name: 'Sign In' });
  }
```

- The page heading, used by specs to prove the user really sees the sign-in screen.

### goto()

```ts
  async goto(): Promise<void> {
    await this.page.goto('/html/signin.html');
  }
```

- A **method** [JS]: a named set of steps that belongs to the class. A test runs it with a dot: `await signInPage.goto()`.
- `async` [JS]: allows `await` inside, and makes the method return a Promise, so the caller must `await` it too.
- `Promise<void>` [TS]: returns a Promise that, when finished, carries no value. It does NOT mean "returns nothing": it returns a Promise, which must be awaited.
- `this.page.goto(...)` [PW]: opens the page in the stored tab. `'/html/signin.html'` is joined to `baseURL` from `playwright.config.ts`, so the browser opens `http://localhost:3000/html/signin.html`.
- What `await` waits for: the browser's `load` event (HTML, scripts and images loaded), Playwright's default. It does not check that every element is ready; `fill()`/`click()` auto-waiting and the spec's `expect` cover that. [page.goto](https://playwright.dev/docs/api/class-page#page-goto)
- ✘ Without `await`, the next step (`fill`) races the page load = flaky. ESLint's `@typescript-eslint/no-floating-promises` reports it.

### signIn()

```ts
  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
```

- `(email: string, password: string)` [TS]: two inputs, both text. `signIn(123, 'Password123')` makes `npm run typecheck` report: `Argument of type 'number' is not assignable to parameter of type 'string'.`
- The values come from the test, not from here, so the wrong-password test reuses this method: `signIn('user@test.com', 'wrongpassword')`.
- `fill()` [PW]: waits until the field is visible and editable, clears it, then types the text.
- `click()` [PW]: waits until the button is visible, stable, enabled and not covered, then clicks. [Auto-waiting](https://playwright.dev/docs/actionability)
- Each line is awaited: finish this step before the next starts.

---

## Sign-in spec

**File:** `tests/specs/sign-in/sign-in.spec.ts` (as of Week 2 Day 1)

**What it does:** two tests for the Sign In screen: a valid user reaches the dashboard, and a wrong password shows the error.

**Rule:** the spec says WHAT is tested and holds every `expect`. Page objects only do things. Docs: [Writing tests](https://playwright.dev/docs/writing-tests), [Assertions](https://playwright.dev/docs/test-assertions).

### Import

```ts
import { test, expect } from '../../fixtures';
```

- `test` and `expect` come from OUR fixtures file, not straight from `@playwright/test`:
  - `test` [OURS, built on PW]: Playwright's `test` plus our page objects, so a test can ask for `{ signInPage }`.
  - `expect` [PW]: Playwright's check, passed through unchanged.
- Both are **functions** we run, so a normal `import` (not `import type`).
- The path: `..` = up one folder. `tests/specs/sign-in/` → `tests/specs/` → `tests/` → `fixtures/`. A folder path finds the folder's `index.ts` by itself.

### The group

```ts
test.describe('Sign in', () => {
```

- `test.describe` [PW]: groups related tests. The report shows `Sign in › valid user reaches the dashboard`.
- `() => { ... }` [JS]: an **arrow function**, a function with no name written inline. `()` = no inputs; `{ ... }` = the steps (here, the tests in the group). Playwright runs it to find the tests inside.

### Test 1: valid user reaches the dashboard

```ts
  test('valid user reaches the dashboard', async ({
    page,
    signInPage,
    dashboardPage,
  }) => {
```

- `test('name', async ({ ... }) => { ... })` [PW]: one test, a name plus the steps. The name states the expected result, so a failure reads like a bug report.
- `async` [JS]: the steps use `await`.
- `({ page, signInPage, dashboardPage })` [JS destructuring]: Playwright passes one object holding every **fixture**; the braces pick the ones this test uses, **by name**:
  - `page` [PW]: a brand-new tab in a brand-new browser context (no cookies or localStorage from other tests).
  - `signInPage`, `dashboardPage` [OURS]: page objects built by `tests/fixtures/index.ts` with this test's tab.
  - All three share ONE tab: Playwright builds `page` once per test and every fixture that asks for it gets the same one.
- List exactly the names the steps use. This test needs `page` for `expect(page)`; test 2 doesn't, so it doesn't list it.

```ts
await signInPage.goto();
await signInPage.signIn('user@test.com', 'Password123');
```

- The user's steps, in order. Each returns a Promise, so each is awaited.

```ts
await expect(page).toHaveURL('/html/dashboard.html');
```

- CHECK 1: the tab moved to the dashboard. `expect(page)` checks the whole tab; `toHaveURL` [PW] checks its address.
- The path is joined to `baseURL`: the full URL must be exactly `http://localhost:3000/html/dashboard.html`.
- It re-checks for up to 5 seconds (the redirect takes a moment). No manual waits.
- ✘ `expect(page.url()).toBe('...')` reads the address once (a plain string): no retry. ✔ Give `expect` the tab. More: [architecture: Checking the URL](../architecture.md#checking-the-url).

```ts
    await expect(dashboardPage.heading).toBeVisible();
  });
```

- CHECK 2: the user can actually SEE the dashboard. A right address with a blank page would pass check 1.
- `toBeVisible()` [PW] re-checks for up to 5 seconds until the element is on screen.
- The heading reads "🧪 Choose a Topic". `name` matches part of the text by default, so `'Choose a Topic'` finds it without the emoji.

### Test 2: wrong password shows the error

```ts
  test('wrong password shows the error', async ({ signInPage }) => {
    await signInPage.goto();
    await signInPage.signIn('user@test.com', 'wrongpassword');

    await expect(signInPage.errorMessage).toBeVisible();
  });
});
```

- Only `signInPage` is listed: the body never uses `page` directly. The tab still exists, because the `signInPage` fixture asks for `page`.
- `signIn()` is reused with a wrong password.
- `await` itself never retries; it only waits for one Promise. The retrying comes from `toBeVisible()`, because `expect` was given a **Locator** it can search for again and again. See [concepts: what actually retries](concepts.md#what-actually-retries-await-vs-web-first-assertions-week-1-day-4).

---

## Fixtures

**File:** `tests/fixtures/index.ts` (as of Week 2 Day 1)

**What it does:** hands each test its page objects by name, so specs never write `new`.

```ts
// ✘ Before (Week 1): in every test
const homePage = new HomePage(page);
// ✔ Now
test('...', async ({ homePage }) => { ... });
```

**Why it exists:** setup lives in one file; a spec names what it needs; Playwright builds only the fixtures a test asks for. A **fixture** is a Playwright idea (not a keyword): something Playwright builds before a test and hands to it by name. `page` is Playwright's own; the five here are ours. Docs: [Fixtures](https://playwright.dev/docs/test-fixtures). Full concept: [concepts: Fixtures](concepts.md#fixtures-week-2-day-1).

### Imports

```ts
import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SignInPage } from '../pages/SignInPage';
import { TaskBoardPage } from '../pages/TaskBoardPage';
import { CreateAccountPage } from '../pages/CreateAccountPage';
import { DashboardPage } from '../pages/DashboardPage';
```

- `test as base` [JS `as`, PW `test`]: Playwright's `test`, renamed `base`, because this file exports its own `test` and one file can't have two things called `test`.
- Page objects use a normal `import` (not `import type`): this file RUNS `new HomePage(...)`.

### The Fixtures type

```ts
type Fixtures = {
  homePage: HomePage;
  signInPage: SignInPage;
  taskBoardPage: TaskBoardPage;
  createAccountPage: CreateAccountPage;
  dashboardPage: DashboardPage;
};
```

- `type` [TS]: gives a name to a shape (a **type alias**). It never runs.
- `Fixtures` [OURS]: any name works; it's only used in this file.
- `homePage`, `signInPage`... [OURS]: the words specs write in `async ({ homePage }) =>`. Renaming one means changing every spec that uses it.
- `: HomePage` [TS]: this fixture holds a `HomePage` object (a class name used as a type).
- It lets `npm run typecheck` catch mistakes:

  ```ts
  // ✘ Wrong: the homePage fixture hands over a SignInPage.
  homePage: async ({ page }, use) => { await use(new SignInPage(page)); },
  // ✔ Right
  homePage: async ({ page }, use) => { await use(new HomePage(page)); },
  ```

### extend

```ts
export const test = base.extend<Fixtures>({
```

- `export const test` [JS]: our new `test`, same name on purpose, so specs write `test(...)` as usual.
- `base.extend(...)` [PW]: a new `test` with everything the old one had (`page`, `context`...) plus our fixtures.
- `<Fixtures>` [TS]: **generics**: hands our type in, so TypeScript knows `homePage` in a test is a `HomePage`.

### One fixture

```ts
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
```

- The property name `homePage:` is what tests ask for.
- Its value is a nameless arrow function that WE write and PLAYWRIGHT calls, before any test that asks for `homePage`. Its inputs, filled by Playwright **by position**:
  1. `{ page }`: from Playwright's object of all fixtures, pick `page`. Picked BY NAME, so it must be spelled `page` (✘ `({ tab }, use)`). Same tab as the test's `page`.
  2. `use`: a function Playwright hands in. The NAME `use` is ours (the docs' convention); `giveToTest` would work the same.
  3. (A third slot, `testInfo`, exists but we don't need it.)
- `new HomePage(page)` creates the object; `use(...)` hands it to the test. Same as `const homePage = new HomePage(page); await use(homePage);`.
- `use(...)` only finishes when the test has finished. Lines after it would be cleanup (none needed here).
- Timeline: tab created → fixture function runs → `new HomePage(page)` → `use()` → test runs → test ends, `use` finishes, cleanup lines → tab closed.
- The fixture only BUILDS the object. Steps like `goto()` stay in the test, because not every test starts on the same page.

The other four fixtures follow the same pattern.

### Re-export expect

```ts
export { expect } from '@playwright/test';
```

- [JS] **re-export**: import and export again in one line, so specs get `test` AND `expect` from `'../../fixtures'`.

---

## NavBar and the dark mode test

Week 2 Day 1. Concepts: [Components and composition](concepts.md#components-and-composition-week-2-day-1), [Checking a class, and the one CSS locator](concepts.md#checking-a-class-and-the-one-css-locator-week-2-day-1).

### NavBar: the class and its constructor

```ts
export class NavBar {
  private readonly mainNavigation: Locator;
  readonly loginLink: Locator;
  // ...signUpLink, taskBoardLink
  readonly darkModeButton: Locator;

  constructor(page: Page) {
    this.mainNavigation = page.getByRole('navigation', { name: 'Main navigation' });
    this.loginLink = this.mainNavigation.getByRole('link', { name: 'Login' });
    // ...
    this.darkModeButton = this.mainNavigation.getByRole('button', { name: 'Toggle dark mode' });
  }
```

- `NavBar` [OURS]: a **component**, not a page object: a part that sits inside many screens. No `Page` in the name, because you can't `goto()` it. Lives in `tests/components/`.
- `constructor(page: Page)` [JS/TS]: `page` is a plain input, NOT stored (no `private readonly`), because no NavBar method uses `this.page`; it's only needed here to build the locators.
- `private readonly mainNavigation` [TS]: specs never use the nav itself, only the links and button inside it.
- `this.mainNavigation.getByRole(...)` [PW]: **chaining**: search only inside the Main navigation, so another "Login" link elsewhere can't cause a strict mode error.
- `getByRole('button', { name: 'Toggle dark mode' })` [PW]: role `button`; the name comes from `aria-label="Toggle dark mode"` (the 🌙 inside is ignored when aria-label is set). Found in Chrome: Inspect → Accessibility → Computed properties.

### NavBar: the actions

```ts
  async openSignIn(): Promise<void> {
    await this.loginLink.click();
  }
  // ...openCreateAccount(), openTaskBoard()
  async toggleDarkMode(): Promise<void> {
    await this.darkModeButton.click();
  }
```

- Same pattern as before: one method per user action, named for the user's goal (`toggleDarkMode`, not `clickDarkModeButton`). camelCase: small first letter.

### HomePage: composition

```ts
export class HomePage {
  readonly navBar: NavBar;
  readonly htmlElement: Locator;

  constructor(private readonly page: Page) {
    this.navBar = new NavBar(page);
    this.htmlElement = page.locator('html');
  }
```

- `readonly navBar: NavBar` [TS]: HomePage HAS a NavBar (**composition**), instead of inheriting from a base class.
- `this.navBar = new NavBar(page)` [JS]: HomePage builds its own NavBar with the same tab. It is NOT passed in as a second constructor input, so the fixture stays `new HomePage(page)`.
  - ✘ `constructor(private readonly page: Page, navBar: NavBar)` → fixture must become `new HomePage(page, new NavBar(page))`
  - ✔ `constructor(private readonly page: Page) { this.navBar = new NavBar(page); }`
- `page.locator('html')` [PW]: the page's root element by a CSS selector (tag name). Our one CSS locator: `<html>` has no role, label or text, so no `getBy...` can find it.
- `private readonly page` is still stored, because `goto()` uses `this.page`.

### The dark mode test

```ts
test.describe('Dark mode', () => {
  test('Toggle dark mode button switches the page to dark mode', async ({
    homePage,
  }) => {
    await homePage.goto();

    await expect(homePage.htmlElement).not.toHaveClass('dark-mode');

    await homePage.navBar.toggleDarkMode();

    await expect(homePage.htmlElement).toHaveClass('dark-mode');
  });
});
```

- Its own `test.describe('Dark mode')` group in `home.spec.ts`: it starts on home but isn't navigation.
- `async ({ homePage })`: only `homePage`, because no line uses `page` directly.
- `.not.toHaveClass('dark-mode')` [PW]: start state. Proves the click is what adds the class: if the page started dark (leftover localStorage) and the button did nothing, the last check alone would still pass.
- `homePage.navBar.toggleDarkMode()`: spec → page object → component → Playwright (three hops at most).
- `.toHaveClass('dark-mode')` [PW]: web-first, retries up to 5 s. A string must match the WHOLE class attribute; `<html>` only gets `dark-mode`, so that's fine. If the app ever adds more classes, use `toContainClass('dark-mode')`.

## Auth setup and the dashboard tests

Week 2 Day 2. Concept: [Auth and storage state](concepts.md#auth-and-storage-state-week-2-day-2).

### auth.setup.ts

```ts
import path from 'path';
import { test as setup, expect } from './fixtures';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup(
  'sign in as user@test.com',
  async ({ page, signInPage, dashboardPage }) => {
    await signInPage.goto();
    await signInPage.signIn('user@test.com', 'Password123');

    await expect(page).toHaveURL('/html/dashboard.html');
    await expect(dashboardPage.heading).toBeVisible();

    await page.context().storageState({ path: authFile });
  },
);
```

- `import path from 'path'` [Node]: Node's built-in module for building file paths that work on Windows and Linux.
- `import { test as setup, expect } from './fixtures'` [JS + OURS]: our `test` = Playwright's `test` extended with our page-object fixtures (`base.extend` in `fixtures/index.ts`), so it has everything Playwright's has plus ours. Renamed to `setup` with `as`, so the file reads as setup and the report shows it as such. `./` = same folder (`tests/`), unlike specs (`../../fixtures`).
- `path.join(__dirname, '../playwright/.auth/user.json')` [Node]: `__dirname` = the folder this file is in (`tests/`); `..` = up one = repo root. Result: `<repo>/playwright/.auth/user.json`. Setup WRITES this path; the config's `storageState` READS its own copy of the path. Both must name the same file: if they differ, every chromium test fails with an error reading the storage state file (ENOENT).
- `setup('sign in as user@test.com', async ({ page, signInPage, dashboardPage }) => { ... })`: one setup step. It lists `page` because the last line uses it, and two page objects from fixtures.
- `signInPage.goto()` / `signIn(...)` [OURS]: the same page-object methods the sign-in spec uses; no new code.
- The two `expect` lines [PW]: wait until sign-in has really finished (URL changed, heading shown) before saving. Without them, the file could be saved signed out.
- `page.context().storageState({ path: authFile })` [PW]: `page.context()` = the browser context this tab belongs to; `storageState({ path })` writes its cookies and localStorage to the file, creating folders if needed.

### playwright.config.ts: the two projects

```ts
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
```

- `name: 'setup'` [PW]: the project's name; `dependencies` refers to it.
- `testMatch: /.*\.setup\.ts/` [JS regex + PW]: this project runs only files whose names end in `.setup.ts` (`\.` = a real dot). `chromium` has no `testMatch`, so it uses the default (`.spec.ts` / `.test.ts`), which is why setup doesn't run twice.
- `...devices['Desktop Chrome']` [JS spread + PW]: copies Chrome's viewport and user agent into `use`. Unchanged.
- `storageState: 'playwright/.auth/user.json'` [PW]: every new context in this project starts with the cookies and localStorage from this file (path from the repo root).
- `dependencies: ['setup']` [PW]: run `setup` first; if it fails, chromium's tests don't run. Also why `--project=chromium` still runs setup.
- When Firefox and WebKit come back (Week 9), each needs the same `storageState` and `dependencies` lines.

### DashboardPage

The Week 2 Day 2 version. Week 2 Day 3 added search, clear, `openTopic` and `topicTitles`: see [Dashboard search and TopicLayout](#dashboard-search-and-topiclayout-week-2-day-3).

```ts
export class DashboardPage {
  readonly heading: Locator;
  readonly topicCards: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Choose a Topic' });
    this.topicCards = page.getByRole('main').getByRole('link');
  }

  async goto(): Promise<void> {
    await this.page.goto('/html/dashboard.html');
  }
}
```

- `private readonly page` [TS]: now stored, because `goto()` uses `this.page`. (Before today the constructor took `page: Page` as a plain input: nothing used it later.)
- `topicCards` [OURS]: each card is an `<a href="dashboard.html?topic=...">` (role `link`). Header and breadcrumb links sit outside `<main>`, so "every link inside main" = exactly the cards. No `name`, because we want all of them (strict mode only applies when you act on one element; `toHaveCount` is fine with many).
- `goto()`: opens the dashboard by URL, like a user typing or bookmarking it. Needed because the signed-out test must hit the URL directly; there's no UI path to the dashboard while signed out.

### dashboard.spec.ts

The two Week 2 Day 2 tests. The three Week 2 Day 3 tests: see [Dashboard search and TopicLayout](#dashboard-search-and-topiclayout-week-2-day-3).

```ts
test.describe('Dashboard, signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signed-out user is sent to sign in', async ({
    page,
    dashboardPage,
    signInPage,
  }) => {
    await dashboardPage.goto();

    await expect(page).toHaveURL('/html/signin.html?redirect=dashboard');
    await expect(signInPage.heading).toBeVisible();
  });
});

test.describe('Dashboard, signed in', () => {
  test('signed-in user sees the topic grid', async ({ dashboardPage }) => {
    await dashboardPage.goto();

    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.topicCards).toHaveCount(4);
  });
});
```

- Two `describe` groups, because `test.use` applies to its whole group: only the signed-out group gets the empty state.
- `test.use({ storageState: { cookies: [], origins: [] } })` [PW]: an empty state instead of `user.json` → no `authToken` → signed out. The same line sits at the top of `sign-in.spec.ts`'s describe.
- Signed out lists `page` because it checks the URL of the tab directly.
- `toHaveURL('/html/signin.html?redirect=dashboard')` [PW]: a string must match the whole URL, query included (joined to `baseURL`). Proves the guard fired and kept the redirect.
- `signInPage.heading` visible: the user really sees the sign-in page, not just a URL.
- Signed in: no `test.use`, so it uses `user.json`. It still calls `goto()` because every test starts on a blank tab.
- `toHaveCount(4)` [PW]: web-first; retries until there are 4 cards (they load from `topics.json` after a short fade), so no manual wait. ✘ `expect(await dashboardPage.topicCards.count()).toBe(4)` counts once, immediately, and fails if the cards haven't loaded yet.

---

## Dashboard search and TopicLayout (Week 2 Day 3)

Files: `tests/pages/DashboardPage.ts` (new lines only), `tests/components/TopicLayout.ts`, `tests/fixtures/index.ts` (one fixture), `tests/specs/dashboard/dashboard.spec.ts` (three tests). Concepts behind them: [concepts: Search, filtering and the loader](concepts.md#search-filtering-and-the-loader-week-2-day-3).

### DashboardPage: new locators

```ts
readonly searchTopicsInput: Locator;
readonly clearSearchButton: Locator;
readonly topicTitles: Locator;
...
this.searchTopicsInput = page.getByRole('searchbox', {
  name: 'Search topics',
});
this.clearSearchButton = page.getByRole('button', { name: 'Clear search' });
this.topicTitles = this.topicCards.getByRole('heading');
```

- `getByRole('searchbox', ...)` [PW]: an `<input type="search">` has the role `searchbox`. Its name "Search topics" comes from `aria-label` (there is no `<label>`; the placeholder is ignored).
- `clearSearchButton` [OURS]: the ✕ button. Its only name is `aria-label="Clear search"` (no visible text). It has the `hidden` attribute until something is typed, and getByRole skips hidden elements, so it is found only after a search. That's fine: tests click it only after searching.
- `topicTitles` [OURS]: the heading (`<h3>`) inside each card. Built from `topicCards` (chaining), so it searches only inside the cards. Lets a spec check exact titles instead of each card's whole text.

### DashboardPage: new methods

```ts
async searchTopics(term: string): Promise<void> {
  await this.searchTopicsInput.fill(term);
}

async clearSearch(): Promise<void> {
  await this.clearSearchButton.click();
}

async openTopic(title: string): Promise<void> {
  await this.topicCards
    .filter({ has: this.page.getByRole('heading', { name: title }) })
    .click();
}
```

- `searchTopics(term: string)` [OURS]: named by the user's intent. `term: string` [TS] = the input must be text. `fill` [PW] types it and fires the `input` event the app filters on.
- `clearSearch()` [OURS]: the user clears the search; the ✕ is how. `click()`, not `clear()` (`clear()` only works on input fields).
- `openTopic(title)` [OURS]: "open" + where it goes (Naming table). `this.topicCards` = only cards (links in `<main>`), so the header's "Space Exploration" link is out. `.filter({ has: ... })` [PW] keeps the card that contains a heading with that name. `this.page` is used here, which is one more reason the class stores the tab. `.click()` does the action; the filter alone only describes the card.

### TopicLayout

```ts
export class TopicLayout {
  readonly loadingSpinner: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.loadingSpinner = page
      .getByRole('status')
      .filter({ hasText: 'Loading...' });
    this.heading = page.getByRole('heading', { level: 1 });
  }
}
```

- What it is: a **component** (in `tests/components/`, no `Page` in the name): the layout all 10 topic pages share, at `/html/dashboard.html?topic=<title>`. Today it has only what a test uses: the loader and the title. From Week 3, topic page objects in `tests/pages/topics/` will hold it as `readonly layout: TopicLayout` (composition, like `homePage.navBar`).
- `constructor(page: Page)` [TS]: a plain input, not `private readonly page`: no method uses the tab later.
- `getByRole('status')` [PW]: the loader is `<div class="loading-spinner" role="status">`. A status element gets no name from its text, so `{ name: 'Loading...' }` would find nothing. `.filter({ hasText: 'Loading...' })` keeps the status that contains that text, so a status inside a topic widget can't match.
- `getByRole('heading', { level: 1 })` [PW]: the page's only `h1`, the topic title. No `name`, because the title is different on each topic; the spec checks which one.

### Fixture

```ts
import { TopicLayout } from '../components/TopicLayout';
...
  topicLayout: TopicLayout;
...
  topicLayout: async ({ page }, use) => {
    await use(new TopicLayout(page));
  },
```

The same three additions every page object has (import, a line in the `Fixtures` type, a fixture). No topic page object exists yet to hold TopicLayout, so tests ask for it directly: `async ({ dashboardPage, topicLayout })`. Both get the same tab, so after `openTopic` clicks a card, `topicLayout` looks at the topic page that opened. It may go once topic page objects hold `layout`.

### The three tests

```ts
test('searching filters the grid to matching topics', async ({
  dashboardPage,
}) => {
  await dashboardPage.goto();
  await expect(dashboardPage.topicCards).toHaveCount(4);

  await dashboardPage.searchTopics('space');

  await expect(dashboardPage.topicTitles).toHaveText(['Space Exploration']);
});
```

- `toHaveCount(4)` first: the grid has loaded, so going down to 1 proves the search changed it.
- `'space'`: part of a word, lower case, as users type. The app matches any part of the title, ignoring case.
- `toHaveText([...])` [PW] with an array: exactly one title, and it is exactly "Space Exploration". Fails on 0, 2 or the wrong title, and retries while the grid redraws (150 ms fade).

```ts
test('clearing the search shows all topics again', async ({
  dashboardPage,
}) => {
  await dashboardPage.goto();
  await expect(dashboardPage.topicCards).toHaveCount(4);

  await dashboardPage.searchTopics('space');
  await expect(dashboardPage.topicCards).toHaveCount(1);

  await dashboardPage.clearSearch();
  await expect(dashboardPage.searchTopicsInput).toBeEmpty();
  await expect(dashboardPage.topicCards).toHaveCount(4);
});
```

- `toHaveCount(1)` after searching: the search took effect, so the clear has something to undo.
- "Reset" means two things a user sees: `toBeEmpty()` [PW] (the input field has no text) and 4 cards back.

```ts
test('opening a topic shows a loader, then the topic', async ({
  dashboardPage,
  topicLayout,
}) => {
  await dashboardPage.goto();

  await dashboardPage.openTopic('Space Exploration');

  await expect(topicLayout.loadingSpinner).toBeVisible();
  await expect(topicLayout.loadingSpinner).toBeHidden();
  await expect(topicLayout.heading).toHaveText('Space Exploration');
});
```

- No count check before `openTopic`: `click()` already waits for the card.
- `toBeVisible` → `toBeHidden` [PW]: the loader appears, then goes. No `waitForTimeout`: `toBeHidden` moves on as soon as the 1.2 s loader is gone.
- `toHaveText('Space Exploration')` (one string: one `h1`): we landed on the topic we clicked. `toBeVisible()` would pass on any topic.

## Tags and BASE_URL (Week 2 Day 3, part 2)

Files: `playwright.config.ts` (top of the file and `baseURL`), `.env.example`, and the tag lines in the three specs. Concepts behind them: [concepts: Tags and environment variables](concepts.md#tags-and-environment-variables-week-2-day-3).

### playwright.config.ts: loading .env

```ts
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });
```

- `import path from 'path'` [Node]: Node's tool for building file paths. Same as in `auth.setup.ts`.
- `import dotenv from 'dotenv'` [Node-npm]: the package added with `npm install --save-dev dotenv`.
- `dotenv.config({ ... })` [Node-npm]: runs once, when Playwright loads the config, before any test. Reads `.env` and copies each `NAME=value` line into `process.env`. It never overwrites a variable that's already set (shell or CI wins).
- `path.resolve(__dirname, '.env')` [Node]: `__dirname` = the folder this file is in (the repo root). ✘ Without it, dotenv looks in the folder you ran the command from, so a run from `tests\` would miss `.env`. ✔ With it, `.env` is always the one next to the config.
- `quiet: true` [Node-npm]: dotenv 17+ prints `◇ injected env (1) from .env` on every load, and Playwright loads the config in each worker.
- No `.env` (CI): dotenv returns an error object instead of throwing. Nothing reads it, so the run carries on with the defaults.

### playwright.config.ts: baseURL

```ts
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
```

- `process.env.BASE_URL` [Node, type `string | undefined` TS]: the value from the shell, CI or `.env`; `undefined` if none set it.
- `|| 'http://localhost:3000'` [JS]: used when the left side is `undefined` **or** empty (`BASE_URL=`). `??` would let an empty string through.
- Every `goto('/html/...')` and `toHaveURL('/html/...')` is joined to this value. Proof it's read: `BASE_URL=http://localhost:3003` in `.env` → setup fails with `page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/html/signin.html`.
- `webServer` is unchanged: it always starts the local app on port 3000.

### .env.example

```ini
# Settings for running the tests. Copy this file to .env (git ignores .env) and
# change values there for your machine. Every value has a default in
# playwright.config.ts, so .env is optional: CI runs without one.

# Where the app under test answers. Default: http://localhost:3000
BASE_URL=http://localhost:3000
```

- Committed, never read by code: it tells a newcomer which settings exist. `.gitignore` has `.env`, `.env.*` and `!.env.example` (`!` = "except this one").
- The sample value equals the default, so copying it changes nothing until you edit it.

### The tag lines (sign-in.spec.ts)

```ts
test.describe('Sign in', { tag: '@regression' }, () => {
  test(
    'valid user reaches the dashboard',
    { tag: '@smoke' },
    async ({ page, signInPage, dashboardPage }) => {
```

- `{ tag: '@regression' }` [PW] on the describe: both sign-in tests get it.
- `{ tag: '@smoke' }` [PW] on the test: adds `@smoke`; this test now has both tags.
- Prettier split the test line over several lines because it got too long; the meaning is the same.
- `home.spec.ts` and `dashboard.spec.ts` follow the same pattern: `@regression` on each describe (4 in all), `@smoke` on "signed-in user sees the topic grid" and "opening a topic shows a loader, then the topic".
