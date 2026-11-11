# Architecture

How this framework is organised, and the rules every test follows. Setup and commands: [setup-guide.md](setup-guide.md). Checks that enforce the rules: [README Guardrails](../README.md#guardrails).

## Folder structure

Folders are created when the first file needs them, so this grows week by week.

```
webapp/               the app under test. Never changed to make a test pass.
docs/                 setup-guide.md, architecture.md (decisions/ added with record 001)
```

Planned next (Week 1): `tests/specs/<app area>/*.spec.ts` hold the tests and every `expect`; `tests/pages/` holds one page object per screen, mirroring specs. Example: `tests/specs/sign-in/sign-in.spec.ts` uses `tests/pages/SignInPage.ts`.

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
- Form fields: `getByLabel` (a password input has no ARIA role, so `getByRole` can't find it; using `getByLabel` for every field keeps them consistent).
- Test IDs are stable but not user-facing: they still pass if the label is missing. Use them only when there is no stable text or role.

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

| ✔ Use (retries)                               | ✘ Not (checks once, flaky)                            |
| --------------------------------------------- | ----------------------------------------------------- |
| `await expect(locator).toBeVisible()`         | `expect(await locator.isVisible()).toBe(true)`        |
| `await expect(locator).toHaveText('Welcome')` | `expect(await locator.textContent()).toBe('Welcome')` |
| `await expect(page).toHaveURL(/dashboard/)`   | `expect(page.url()).toContain('dashboard')`           |
| `await expect(locator).toHaveCount(3)`        | `expect(await locator.count()).toBe(3)`               |
| `await expect(locator).toHaveValue('hello')`  | `expect(await locator.inputValue()).toBe('hello')`    |

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
await expect(page).toHaveURL(/dashboard/);
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
- Composition over inheritance: no `BasePage` or `BaseTest`.
- No wrappers around Playwright's own API (no custom click, wait, retry or log helpers).
- At most three hops from a test to a locator: spec → page object → Playwright.

Source: [Page object models](https://playwright.dev/docs/pom).

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
