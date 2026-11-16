# Concepts

Reference notes for every TypeScript, JavaScript and Playwright concept used in this repo, in plain English, organised by topic. Each heading says when it was first learned. New concepts are added in the session they come up.

- Line-by-line explanations of our actual files: [walkthroughs.md](walkthroughs.md).
- Framework rules (what we do, not why it works): [../architecture.md](../architecture.md).
- Labels used below: **[JS]** JavaScript, **[TS]** TypeScript only, **[PW]** Playwright, **[OURS]** a name we chose.

## Coming from C# and Selenium

Quick map from what you know. "Watch out" marks things that look the same but behave differently.

| Here                                      | Closest in C# / Selenium / SpecFlow        | Watch out                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `const` / `let`                           | `readonly` local / `var`                   | `const` stops reassigning the name, not changing what's inside (a `const` array can still be pushed to). Never use JS `var`.                          |
| `string`, `number`, `boolean`             | `string`, `int`/`double`/`decimal`, `bool` | Only one `number` type. Use lowercase types, never `String`/`Number`.                                                                                 |
| Types and interfaces                      | Types and interfaces                       | Types are **removed before the code runs**: no runtime type checks. An object fits an interface if it has the right shape, even without `implements`. |
| `class`, constructor, properties, methods | Same idea                                  | `this.` is required inside a class. Parameter properties (`constructor(private readonly page: Page)`) declare and store in one line.                  |
| `async` / `await`, `Promise<T>`           | `async` / `await`, `Task<T>`               | A forgotten `await` fails **silently** and makes tests flaky. ESLint `no-floating-promises` catches it.                                               |
| `===`                                     | `==`                                       | Always `===`; JS `==` converts types first.                                                                                                           |
| `null` and `undefined`                    | `null`                                     | Two "empty" values.                                                                                                                                   |
| `import` / `export`                       | `using` / `public`                         | Each file is a module: names are private unless exported.                                                                                             |
| Locator (`page.getByRole(...)`)           | `By` + `FindElement`                       | Not searched until used, re-searched every time, and **waits automatically**. No `WebDriverWait`.                                                     |
| `await expect(locator).toBeVisible()`     | NUnit `Assert`                             | **Retries** until it passes or 5 s pass. `Assert` checks once.                                                                                        |
| Fixtures (`{ page }`, `{ signInPage }`)   | SpecFlow hooks + context injection         | Built only for tests that ask for them, cleaned up after each test.                                                                                   |
| Browser context                           | New `IWebDriver` session                   | Cheap: every test gets a fresh one (no cookies or storage from others).                                                                               |
| `test.describe` / `test`                  | `[TestFixture]` / `[Test]`                 |                                                                                                                                                       |

---

---

## Locators (Week 1 Day 3)

Sources: [Locators](https://playwright.dev/docs/locators), [Best practices](https://playwright.dev/docs/best-practices#use-locators)

**1. What it is.** A locator is a description of how to find an element. It isn't the element itself. Playwright looks the element up fresh every time you use it, so the locator still works after the page re-renders.

**2. How it works on our page.** The sign-in HTML has a label with `for="email"` and the text "Email", then an input field with `id="email"`. The `for` and `id` match, so the browser links the label to the field, and the field's name becomes "Email". (Try it: click the word "Email" and the cursor jumps into the field.)

```ts
page.getByLabel('Email'); // returns the INPUT FIELD the label points to, not the label
```

Nothing is searched yet. The search happens when you act on it (`await ... .fill('user@test.com')`), and Playwright waits until the element is ready.

**3. Recommended order:** `getByRole` → `getByLabel` → `getByText` → `getByPlaceholder` / `getByAltText` / `getByTitle` → `getByTestId` last.

- The user-facing ones find things the way a user does, by what's on screen. If the label breaks, the test fails, and that's a real bug a user would hit.
- They check accessibility for free: an input field with no label has no `getByLabel`.
- Playwright's docs: role locators for interactive elements (button, link, input); text locators for plain text (div, span, p).
- `getByPlaceholder` is weaker than `getByLabel`: placeholder text disappears as soon as you type.

**4. Other ways, and why not:**

- ✘ `page.locator('#email')` (CSS id): breaks if a developer renames the id; users never see ids.
  ✔ `page.getByLabel('Email')`
- ✘ `page.locator('//form/input[1]')` (XPath by position): breaks if anything is added above it.
  ✔ `page.getByLabel('Email')`
- `getByTestId('signin-email-input')`: not wrong, just second best. Docs call test IDs "the most resilient" but "not user facing". It never breaks on text changes, but it also passes when the label is missing or wrong, so it hides a bug a user would notice.
- Pick locator / codegen suggest test IDs when the page has `data-testid`. That's the tool's preference, not our rule. Always review what they generate.

**5. When a test ID is fine:** no stable user-facing handle, e.g. an icon with no text, a chart, or text that changes every time.

**6. Interview answer:** "I use user-facing locators first, getByRole and getByLabel, because they find elements the way a user does and fail when something a user relies on breaks. I fall back to test IDs only when there's no stable visible text or role, and I avoid CSS and XPath tied to page structure."

**C# / Selenium:** like `By` + `FindElement`, but nothing is searched until you act, it re-searches every time, and it waits automatically.

**Advanced, later:** filtering (`locator.filter()`). Chaining (one locator inside another) is already used: `page.getByRole('main').getByText(...)`.

### The locators we chose for sign-in, and why

| Element        | ✔ We use                                        | Why not the others                                                                                                                                                                          |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email field    | `page.getByLabel('Email')`                      | `getByRole('textbox', { name: 'Email' })` also works, but we use getByLabel for both fields so they read the same. Test ID: not user-facing.                                                |
| Password field | `page.getByLabel('Password')`                   | Playwright also finds it as `getByRole('textbox', { name: 'Password' })` (see the role table). We use `getByLabel` for every form field: the Locators page recommends it for form controls. |
| Sign In button | `page.getByRole('button', { name: 'Sign In' })` | `getByText('Sign In')` matches the heading AND the button: 2 matches, so the test fails (strict mode). getByRole also checks it really is a button.                                         |

---

## ARIA, roles and the accessibility tree (Week 1 Day 3)

Sources: [Locate by role](https://playwright.dev/docs/locators#locate-by-role), [Locate by label](https://playwright.dev/docs/locators#locate-by-label), W3C [ARIA in HTML](https://www.w3.org/TR/html-aria/) (which role each HTML tag gets)

**The accessibility tree.** The browser builds a second, simplified version of the page for screen readers. In it, every element has:

- a **role**: what it is to a user (button, link, heading, textbox, checkbox).
- a **name**: what it's called, usually its text or its label.

**ARIA** (Accessible Rich Internet Applications) is the web standard that defines those roles.

**Tag vs role.** The HTML tag is how the page is built; the role is what the user experiences. `getByRole` searches roles, not tags. The browser works the role out from the tag plus its attributes:

| HTML                                  | Role                              | What decides it                                                                                                                                                  |
| ------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `button` tag (any `type`)             | button                            | The tag. `type="submit"` only changes what a click does.                                                                                                         |
| `input type="text"` or `type="email"` | textbox                           | The input's `type`                                                                                                                                               |
| `input type="checkbox"`               | checkbox                          | The input's `type`                                                                                                                                               |
| `input type="submit"`                 | button                            | The input's `type`                                                                                                                                               |
| `input type="password"`               | textbox in Playwright (W3C: none) | The W3C table says "no role", but Playwright and Chrome treat it as a textbox, so `getByRole('textbox', { name: 'Password' })` works. We still use `getByLabel`. |
| `h1` to `h6`                          | heading                           | The tag                                                                                                                                                          |
| `a` with `href`                       | link                              | The tag                                                                                                                                                          |
| any element with `role="button"`      | button                            | An explicit `role` attribute overrides the tag                                                                                                                   |

**Where the name comes from:** a button's or link's text ("Sign In"); an input's label (`for`/`id`) or `aria-label`.

**See it yourself:** Pick locator, or Chrome DevTools → Elements → **Accessibility** tab, shows an element's role and name.

```ts
// ✘ Wrong: 'input' is a tag, not a role. This finds nothing.
page.getByRole('input', { name: 'Email' });
// ✔ Right: the role of an email input is 'textbox'.
page.getByRole('textbox', { name: 'Email' });
```

### Full table: which HTML elements have which role (Week 1 Day 4)

Source: W3C [ARIA in HTML](https://www.w3.org/TR/html-aria/) (the official mapping browsers follow). Playwright's `getByRole` uses these roles: [Locate by role](https://playwright.dev/docs/locators#locate-by-role).

**How to read it:** if an element's role is a real role (button, link, heading...), `getByRole('<role>', { name: '...' })` can find it. If the role is **generic** or **none**, `getByRole` has nothing useful to search for, so use the next locator in the list: `getByLabel` (form fields) or `getByText` (plain text).

**Things you click or type into**

| HTML                                                  | Role                               | Example in our app / note                                           |
| ----------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| `button` (any `type`)                                 | button                             | Sign In: `getByRole('button', { name: 'Sign In' })`                 |
| `input type="submit"`, `type="button"`                | button                             |                                                                     |
| `a` **with** `href`                                   | link                               | Nav "Login": `getByRole('link', { name: 'Login' })`                 |
| `a` **without** `href`                                | generic                            | Not a link to a user. Use `getByText`.                              |
| `input type="text"`, `type="email"`, no `type` at all | textbox                            | Email field (we still use `getByLabel` for all form fields)         |
| `textarea`                                            | textbox                            |                                                                     |
| `input type="search"`                                 | searchbox                          |                                                                     |
| `input type="password"`                               | W3C: none. **Playwright: textbox** | See "Correction" below the tables. We use `getByLabel('Password')`. |
| `input type="checkbox"`                               | checkbox                           | Act with `check()` / `uncheck()`                                    |
| `input type="radio"`                                  | radio                              |                                                                     |
| `input type="range"`                                  | slider                             | Volcanic Worlds slider (Week 3)                                     |
| `input type="number"`                                 | spinbutton                         |                                                                     |
| `select` (normal drop-down)                           | combobox                           | Act with `selectOption()`                                           |
| `select multiple`                                     | listbox                            |                                                                     |
| `option`                                              | option                             |                                                                     |
| `details` / `summary`                                 | group / (varies)                   | `summary` has no fixed role: browsers differ                        |
| `dialog`                                              | dialog                             |                                                                     |

**Text and structure**

| HTML                       | Role                                     | Example in our app / note                                                    |
| -------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `h1` to `h6`               | heading (level 1 to 6)                   | `getByRole('heading', { name: 'Choose a Topic' })`; add `level: 1` if needed |
| `p`                        | paragraph                                |                                                                              |
| `strong`                   | strong                                   |                                                                              |
| `img` with non-empty `alt` | img                                      | The `alt` text is its name. Or use `getByAltText`.                           |
| `img` with `alt=""`        | none                                     | Decorative: hidden from screen readers on purpose                            |
| `ul`, `ol`                 | list                                     |                                                                              |
| `li` (inside a list)       | listitem                                 |                                                                              |
| `table`, `tr`, `td`, `th`  | table, row, cell, columnheader/rowheader | Week 5 sort test                                                             |
| `progress`                 | progressbar                              |                                                                              |
| `label`                    | none                                     | It names a field; `getByLabel` returns the FIELD, not the label              |
| `div`, `span`              | **generic**                              | Sign-in error message (`div`): use `getByText('Invalid email or password.')` |

**Correction (Week 1 Day 4): password inputs.** On Day 3 we said a password input has no role, so `getByRole` can't find it. That was wrong for Playwright. The W3C table says "No corresponding role", but Playwright's own role engine (and Chrome) treat a password input as a **textbox**. Proof: the page snapshot in the Day 4 strict-mode error shows `textbox "Password"`, and `page.getByRole('textbox', { name: 'Password' })` finds exactly 1 element (checked in Playwright 1.63). So both work:

```ts
// ✔ Works: Playwright gives a password input the role textbox, named by its label.
page.getByRole('textbox', { name: 'Password' });
// ✔ What we use: same element; getByLabel is the Locators page's choice for form fields.
page.getByLabel('Password');
```

Lesson: the W3C table is the standard, but what Playwright actually sees is the page snapshot (error output, UI mode, `locator.ariaSnapshot()`). When they differ, trust what Playwright shows and test it.

**Page areas (landmarks)** — useful for scoping (narrowing a search to one part of the page):

| HTML      | Role          | Condition                                                                                  |
| --------- | ------------- | ------------------------------------------------------------------------------------------ |
| `main`    | main          | Always. Our pages wrap the content in `main`.                                              |
| `nav`     | navigation    | Always. Our pages have two, named by `aria-label`: "Main navigation", "Topics navigation". |
| `header`  | banner        | Only when NOT inside `article`, `aside`, `main`, `nav` or `section`; else generic          |
| `footer`  | contentinfo   | Same condition as `header`                                                                 |
| `aside`   | complementary |                                                                                            |
| `article` | article       |                                                                                            |
| `form`    | form          | Only counts as a landmark when it has a name (e.g. `aria-label`). Ours has none.           |
| `section` | region        | Only with a name; otherwise generic                                                        |

**Attributes that change things**

- `role="..."` on any element **overrides** the tag. Example: a `div role="button"` is a button; a `div role="alert"` is an alert. Common ones: `alert`, `status`, `dialog`, `tab`, `tablist`, `tabpanel`.
- `aria-label="..."` gives an element a **name** (it does not change the role). Example: `nav aria-label="Main navigation"` → `getByRole('navigation', { name: 'Main navigation' })`.
- `aria-live="polite"` gives **no role**. It only tells a screen reader "read out new text that appears here". That's why the sign-in error `div` (which has `aria-live`) is still generic.

```ts
// ✘ Wrong: 'div' is a tag, and a div's role is generic. This finds nothing useful.
page.getByRole('div', { name: 'Invalid email or password.' });
// ✔ Right: plain text in a div -> getByText (Locators page: "We recommend using text
//   locators to find non interactive elements like div, span, p").
page.getByText('Invalid email or password.');
```

**How to find roles on ANY app (Week 1 Day 4):**

1. Chrome DevTools → Elements → right-click → Inspect → **Accessibility** tab: "Computed Properties" shows Role and Name. Tick **"Enable full-page accessibility tree"**, then the button at the top of the Elements panel switches the whole page to a role view (landmarks, buttons, links). Start here on an unfamiliar app.
2. Playwright **Pick locator** (UI mode or VS Code Testing panel): hover to get a suggested locator. It prefers test ids if the page has them, so treat it as a hint.
3. The **page snapshot** in `test-results/<test>/error-context.md` after a failure: exactly what `getByRole` sees. Indentation = what's inside what.
   Catch: Chrome's tree shows our unnamed `form` as `form ""`, but Playwright's `getByRole('form')` finds 0 (it needs a name, e.g. `aria-label`; tested Day 4: unnamed 0, named 1). Chrome's tree is for exploring; Playwright's page snapshot is the final word. "Ignored" rows in Chrome = elements with no meaning to users (layout divs).
4. W3C [ARIA in HTML](https://www.w3.org/TR/html-aria/) for the rules. When it disagrees with the browser (password inputs), trust the browser and Playwright.

**Interview line:** "getByRole finds elements by their accessibility role and name, the same information a screen reader uses, so the test sees the page the way users and assistive tech do. The role comes from the tag and its attributes, for example an email input is a textbox. For form fields we prefer getByLabel, because the label is what the user reads next to the field."

---

## TypeScript basics used in SignInPage and the first spec (Week 1 Day 3)

Sources: [TypeScript handbook: Everyday types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html), [Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html), [Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)

### Types and type annotations

**What it is.** A _type_ describes what kind of value something is: text (`string`), a number (`number`), true/false (`boolean`), or something Playwright defines (`Page`, `Locator`). A _type annotation_ is the `: something` after a name, which tells TypeScript what that name must hold.

```ts
email: string          // email must be text
readonly emailInput: Locator   // emailInput must hold a Locator
```

**Why.** `tsc` (`npm run typecheck`) checks every annotation before the test runs, so a mistake fails in seconds with a clear message, not halfway through a browser run.

```ts
// ✘ Wrong: a number where text is expected. tsc: Argument of type 'number' is not assignable to parameter of type 'string'.
await signInPage.signIn(123, 'Password123');
// ✔ Right
await signInPage.signIn('user@test.com', 'Password123');
```

### `const`

**What it is.** `const` creates a named value (a _variable_) that can't be pointed at something else later.

```ts
const signInPage = new SignInPage(page); // signInPage now names this test's page object
```

- ✘ `signInPage = new SignInPage(otherPage);` later in the test: tsc error, because `const` can't be reassigned.
- `let` is the alternative, for a value that must change (e.g. a counter). Use `const` by default; it tells the reader "this never changes". `var` is the old way: never use it.
- **C#:** `let` ≈ `var`; `const` ≈ a `readonly` local. **Watch out:** `const` stops you reassigning the name, not changing what's inside: a `const` array can still be pushed to.

### `import`, `export` and `import type`

**What it is.** Each `.ts` file is a _module_: its names are private unless it **exports** them. Another file **imports** them to use them.

```ts
// SignInPage.ts
export class SignInPage { ... }            // allow other files to use SignInPage

// sign-in.spec.ts
import { SignInPage } from '../../pages/SignInPage';   // use it here
```

- The path is relative to the file doing the importing: `..` = up one folder. From `tests/specs/sign-in/` two `..` reach `tests/`, then `pages/SignInPage`. No `.ts` at the end.
- ✘ Forget `export` → the spec's import fails: `Module has no exported member 'SignInPage'`.

**Normal import vs `import type`.** Some things you import are **code that runs** (functions like `test` and `expect`: they do something when the test runs). Some are **only types** (`Page`, `Locator`: labels TypeScript uses to check your code; they don't exist when the test runs).

```ts
import { test, expect } from '@playwright/test'; // real code: test() and expect() run
import type { Locator, Page } from '@playwright/test'; // labels only: used in `: Page`, `: Locator`
```

**Simple test:** look at how the name is used in the file.

| How the name is used                 | Example                             | Import with   |
| ------------------------------------ | ----------------------------------- | ------------- |
| Only after a colon (a label for tsc) | `page: Page`, `emailInput: Locator` | `import type` |
| Run with brackets (does something)   | `test(...)`, `expect(...)`          | `import`      |

A type is like a column type in a test-case spreadsheet: a "Date" column only accepts dates. `Page` = "a browser tab", `Locator` = "a way to find an element".

**Labels vs real objects.** The _words_ `Page` and `Locator` are labels and never run. The real page Playwright hands the test, and the locators built from it, do all the work (`this.page.goto(...)`, `this.emailInput.fill(...)`). Also: Playwright does **not** type-check when running tests; it deletes the labels and runs. That's why `npm run typecheck` is a separate step, run before the tests.

When the test runs, TypeScript strips all types out first (the browser and Node only understand JavaScript). An `import type` line is removed completely, which tells the reader: "nothing from this line runs; it's only for checking." A plain `import` of `Page` would also work; `import type` just states the intent exactly.

### Classes, objects, properties, constructors and methods

**What it is.** A **class** is a blueprint. An **object** is one thing built from the blueprint with `new`. Our blueprint is `SignInPage`; each test builds its own object:

```ts
const signInPage = new SignInPage(page);
```

Inside a class:

| Part            | What it is                                                                | In SignInPage                                         |
| --------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Property**    | A named value stored on the object                                        | `emailInput`, `passwordInput`, `signInButton`, `page` |
| **Constructor** | Code that runs once, when `new` builds the object; sets up the properties | `constructor(private readonly page: Page) { ... }`    |
| **Method**      | A function that belongs to the object; you call it with a dot             | `goto()`, `signIn(email, password)`                   |
| **`this`**      | "This object", used inside the class to reach its own properties          | `this.emailInput.fill(email)`                         |

**Modifiers on properties:**

- `readonly`: can be set in the constructor, then never replaced. ✘ `signInPage.emailInput = page.getByLabel('Name')` → tsc error.
- `private`: only code inside the class can use it. The spec can't write `signInPage.page`; it uses the methods instead.
- No modifier (public): anyone can read it. Our locators are public so a spec can assert on them, e.g. `await expect(signInPage.signInButton).toBeEnabled()`.

**Parameter property** (the shortcut in our constructor):

```ts
// ✔ Short form (what we use): declares, stores and protects `page` in one line
constructor(private readonly page: Page) { ... }

// Same thing, long form:
private readonly page: Page;
constructor(page: Page) {
  this.page = page;
}
```

**C#:** the same idea as a C# class. **Watch out:** inside a class you must write `this.` to reach a property (`this.emailInput`), and `private readonly page: Page` in the constructor is TypeScript's shortcut for declaring and storing in one line.

**Interview line:** "A page object is a class: the constructor receives the Playwright page and builds readonly locators, and methods wrap user actions like signIn. Tests create one per test with new, so nothing is shared between tests."

### Promises, `async` and `await`

**Promise.** Not a method. A Promise is an object built into JavaScript that stands for "work that has started but may not have finished yet". Browser work takes time, so `page.goto('/html/signin.html')` starts loading the page and **immediately** returns a Promise. Later that Promise either finishes successfully (the page loaded) or fails with an error (e.g. the server is down).

**`await`.** Pause this code until that Promise finishes. If it failed, the test fails on that line, with that error.

**`async`.** A keyword on a function or method. It does two things:

1. It allows `await` inside. ✘ Using `await` in a method without `async` is an error: `'await' expressions are only allowed within async functions`.
2. It makes the method return a Promise automatically. So whoever calls it must `await` it too: `goto()` awaits `page.goto()`, and the test awaits `signInPage.goto()`.

`async` does **not** by itself make anything run in the background. The caller decides: with `await` the test waits; without `await` the test moves straight on to the next line (the flaky-test bug below).

**`Promise<void>`.** The return type of an async method: "returns a Promise that, when finished, carries no value". `void` = nothing to give back. `goto()` and `signIn()` just do work.
Compare a Playwright method that does give a value back:

```ts
const title = await page.title(); // page.title() returns Promise<string>; title = 'Sign In — Testing Playground'
```

```ts
// ✘ Wrong: no await. The next line starts while the page is still loading.
// Sometimes the page is fast enough (passes), sometimes not (fails) = flaky.
signInPage.goto();
await signInPage.signIn('user@test.com', 'Password123');

// ✔ Right: each step finishes before the next starts.
await signInPage.goto();
await signInPage.signIn('user@test.com', 'Password123');
```

Guardrail: ESLint's `no-floating-promises` reports any Promise you forget to await.

**C#:** `Promise<T>` ≈ `Task<T>`, `async`/`await` work the same way. **Watch out:** in C# a missed `await` usually gives a compiler warning; here it compiles silently and the test races ahead. That's why the lint rule matters.

**Interview line:** "Every Playwright action is asynchronous and returns a Promise, so every call is awaited; otherwise steps overlap and tests become flaky. Page object methods are async and typed Promise<void> because they perform actions without returning a value."

### Does `npm test` check types? (No.)

- **Which tool catches type mistakes:** TypeScript's checker, `tsc`, which you run with `npm run typecheck`. VS Code uses the same checker for its red underlines while you type.
- **`npm test` does not run it.** Playwright deletes the type labels and runs the test without checking them.
- So a type mistake still **runs**, and only fails if it breaks something while the test runs, with a less clear message. Example: `signInPage.signIn(123, 'Password123')`
  - `npm run typecheck` reports straight away: `Argument of type 'number' is not assignable to parameter of type 'string'.`
  - `npm test` (without typecheck) opens the browser, reaches `fill(123)`, and only then fails: `locator.fill: value: expected string, got number`.
- Some type mistakes don't break anything at run time, so the test passes and the mistake sits there unnoticed.
- Who removes the labels: **Playwright itself** (a converter built into `@playwright/test`). Docs: "Playwright will read them, transform to JavaScript and run" and "Playwright does not check the types... We recommend you run TypeScript compiler alongside Playwright." ([TypeScript in Playwright](https://playwright.dev/docs/test-typescript)). Checking is `tsc`, from the `typescript` package.
- That's why the order is format:check → lint → **typecheck** → test, and why CI will run typecheck too (Week 1 Day 4).

---

## Playwright test basics (Week 1 Day 3)

Sources: [Writing tests](https://playwright.dev/docs/writing-tests), [Assertions](https://playwright.dev/docs/test-assertions), [Fixtures](https://playwright.dev/docs/test-fixtures)

### `test`, `test.describe` and the `{ page }` fixture

```ts
test.describe('Sign in', () => {
  test('valid user reaches the dashboard', async ({ page }) => {
    // steps and assertions
  });
});
```

- `test('name', async ({ page }) => { ... })` defines one test: a **name** (say the expected outcome, so a failure reads like a bug report) and a **body** (an async function, so you can `await` inside).
- `test.describe('Sign in', ...)` groups related tests. The report shows "Sign in › valid user reaches the dashboard".
- `{ page }` asks Playwright for a **fixture**: something it prepares before the test and cleans up after. `page` is a fresh tab in a fresh, empty browser context (no cookies or storage from other tests). That's why each test is independent. Custom fixtures come in Week 2.
- `() => { ... }` is an **arrow function**: a short way to write a function. `async ({ page }) => { ... }` is a function that receives an object and pulls the `page` out of it.

### Assertions with `expect`

An **assertion** is a check: "this must be true, or the test fails". Playwright's **web-first** assertions retry until they pass or time out (5 seconds by default), so you never add waits.

```ts
await expect(page).toHaveURL('/html/dashboard.html'); // page address
await expect(
  page.getByRole('heading', { name: 'Choose a Topic' }),
).toBeVisible(); // element on screen
```

- Always `await` them: an un-awaited expect never actually waits or fails.
- `toHaveURL` with a string: the string is joined to `baseURL` (`http://localhost:3000`), and the full address must match exactly. Source: [toHaveURL](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-url).
- Why two assertions: the URL proves the redirect happened; the heading proves the user actually sees the dashboard. Either one alone could pass on a broken page.

```ts
// ✘ Wrong: reads the URL once, immediately; the redirect may not have happened yet = flaky.
expect(page.url()).toBe('http://localhost:3000/html/dashboard.html');
// ✔ Right: retries until it matches.
await expect(page).toHaveURL('/html/dashboard.html');
```

**C# / NUnit:** like `Assert.That`, except a web-first assertion **retries** until it passes or 5 seconds pass; `Assert` checks once.

**Regular expressions (for later).** `toHaveURL` also accepts a _pattern_ such as `/dashboard/` (between slashes) meaning "contains dashboard". Use one only when the URL varies (e.g. ends with `?id=123`). For a fixed address, the plain string is clearer.

### Checking the URL: wrong and right (Week 1 Day 5)

Source: [toHaveURL](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-url)

```ts
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

- A string must match the **whole** URL, including any `?query`.
- The URL alone isn't proof: follow it with a check the user would see, e.g. the page heading.

### What actually retries? `await` vs web-first assertions (Week 1 Day 4)

Sources: [Assertions](https://playwright.dev/docs/test-assertions), [Best practices: web-first assertions](https://playwright.dev/docs/best-practices#use-web-first-assertions)

- **`await` never retries.** It only pauses until one Promise finishes, then carries on.
- **The retrying is done by the assertion** (`toBeVisible`, `toHaveText`, `toHaveURL`...), and only when `expect` is given a **Locator** (or the `page`). It searches the page, checks, and if the check fails it searches again, until it passes or 5 seconds have gone. Docs: "The following assertions will retry until the assertion passes, or the assertion timeout is reached." and "By default, the timeout for assertions is set to 5 seconds."
- If `expect` is given a plain value (a string, a number, `true`), there is nothing to search again, so `toBe` compares **once**. Docs: "using non-retrying assertions can lead to a flaky test."

**Where the `await` sits tells you what is waited for.** JavaScript works out what's inside brackets first (like `(2 + 3) * 4`).

```ts
// ✘ The await is INSIDE expect's brackets. Order:
//   1. textContent() waits until the error element exists, then reads its text ONCE.
//      Our error div is in the HTML from page load, empty, so an early read gives ''.
//   2. expect('') receives a fixed string, not a Locator.
//   3. toBe compares '' with the expected text once -> fails. No second try.
expect(await page.getByText('Invalid email or password.').textContent()).toBe(
  'Invalid email or password.',
);

// ✔ The await is at the FRONT. Order:
//   1. expect(...) receives the Locator (nothing searched yet).
//   2. toBeVisible() searches and re-checks for up to 5 seconds.
//   3. The await at the front waits for all that re-checking to finish.
await expect(page.getByText('Invalid email or password.')).toBeVisible();
```

Honest note: on our fast app the ✘ version would probably pass most runs. That's the danger: it passes on your PC and fails now and then in CI, where the machine is slower.

**Interview line:** "`await` just waits for a Promise to finish. The retrying comes from web-first assertions like `toBeVisible`, which re-query the locator until the check passes or the timeout runs out."

### How a spec checks something that a page object finds: 4 options (Week 1 Day 4)

Decision for this repo: **option 4**. Rule in [../architecture.md](../architecture.md#page-objects). Example: the sign-in error message.

**1. A method returns the text; the spec compares it with `toBe`. ✘ Rejected: flaky.**

```ts
// SignInPage.ts
async getErrorText(): Promise<string | null> {
  return await this.errorMessage.textContent(); // reads the text ONCE, right now
}
// sign-in.spec.ts
expect(await signInPage.getErrorText()).toBe('Invalid email or password.');
```

`textContent()` reads once, with no retry (see "What actually retries?" above). If the error appears a moment after the click, the test fails some of the time. The Best practices page names this exact shape as the bad example:
✘ `expect(await page.getByText('welcome').isVisible()).toBe(true);`
✔ `await expect(page.getByText('welcome')).toBeVisible();`

**2. The `expect` goes inside the page object. ✘ Not in this repo.**

```ts
// SignInPage.ts
async expectErrorVisible(): Promise<void> {
  await expect(this.errorMessage).toBeVisible();
}
// sign-in.spec.ts
await signInPage.expectErrorVisible();
```

It retries, so it isn't flaky. But it breaks our rule "every `expect` lives in the spec", and the spec no longer shows what is checked. Martin Fowler's [PageObject](https://martinfowler.com/bliki/PageObject.html) article also says page objects should not make assertions themselves. Some workplaces use this style; it isn't wrong there, but it hides the checks.

**3. A method that returns the locator. ✘ More code, same result.**

```ts
// SignInPage.ts
getErrorMessage(): Locator {
  return this.errorMessage;
}
// sign-in.spec.ts
await expect(signInPage.getErrorMessage()).toBeVisible();
```

Behaves exactly like option 4 but adds a method that does nothing extra. Over-engineering.

**4. A `readonly` Locator property on the page object; the spec checks it. ✔ What we do.**

```ts
// SignInPage.ts
readonly errorMessage: Locator;
this.errorMessage = page.getByText('Invalid email or password.'); // in the constructor
// sign-in.spec.ts
await expect(signInPage.errorMessage).toBeVisible();
```

- Web-first: retries, not flaky.
- The locator lives in one place, the page object.
- The check is visible in the spec.
- Playwright's own [Page object models](https://playwright.dev/docs/pom) example does exactly this: `readonly tocList: Locator` in the page object, and `await expect(playwrightDev.tocList).toHaveText([...])` in the test.

**Why `getByText` for the error:** the error is a `div` (role generic, see the role table), not a form field. [Locators](https://playwright.dev/docs/locators#locate-by-text): "We recommend using text locators to find non interactive elements like div, span, p". Test ids only "when you can't locate by role or text".

**Nuance:** the expected wording now sits inside the locator in the page object, not in the spec. Fine for one fixed message. When a page can show several different errors (Create Account, Week 3), a team usually locates the error area once and checks the wording in the spec with `toHaveText(...)`.

**Interview line:** "Page objects expose locators as readonly properties and the spec asserts on them with web-first assertions, so the checks retry and stay visible in the test. Methods that return text break retrying, and assertions inside page objects hide what the test checks."

### What are `Page` and `Locator` behind the scenes? (short version; full "interfaces" lesson later)

- In the code we import, `Page` and `Locator` are TypeScript **interfaces**: a _description_ of an object (a list of what it has and can do), not the object itself.
- The things they can do are **methods**: `page.goto()`, `page.getByLabel()`, `locator.fill()`, `locator.click()`.
- Playwright's own real classes build the actual objects. A test never writes `new Page()`; Playwright creates the page and hands it over through `{ page }`.
- Because an interface is only a description, nothing from it runs, which is why `import type` works.
- The docs call them "class: Page" / "class: Locator" in the [API reference](https://playwright.dev/docs/api/class-page): look up every method there.
- See it yourself: Ctrl+click `Locator` in VS Code to open `export interface Locator` in Playwright's type file.

## Fixtures (Week 2 Day 1)

Docs: https://playwright.dev/docs/test-fixtures

1. **What / problem:** `{ page }` is already a fixture: Playwright builds it before the test, hands it in by name, throws it away after. Custom fixtures do the same for our page objects, so specs ask for `{ homePage }` instead of writing `new HomePage(page)` in every test.
2. **How (our app):**

```ts
import { test as base } from '@playwright/test'; // Playwright's test, renamed base (we export our own test)
import { HomePage } from '../pages/HomePage';

type Fixtures = { homePage: HomePage }; // type alias: fixture name -> type of its value

export const test = base.extend<Fixtures>({
  // new test = base + our fixtures; <Fixtures> = generic, tells TS the types
  homePage: async ({ page }, use) => {
    // fixture function: may ask for other fixtures; gets use()
    await use(new HomePage(page)); // hand the value to the test; returns when the test ends (cleanup after)
  },
});

export { expect } from '@playwright/test'; // specs import test AND expect from one place
```

Spec: `import { test, expect } from '../../fixtures';` then `test('...', async ({ homePage }) => { ... })`.
On demand: only fixtures a test names are built ("setup only the ones needed by your test and nothing else"). 3. **Recommended:** one fixture per page object in `tests/fixtures/index.ts`; specs never use `new`. 4. **Alternatives (not used):**

- ✘ `const homePage = new HomePage(page);` in every test -> repeated, every spec imports every page object.
  ✔ `async ({ homePage }) => { ... }`
- ✘ `let homePage: HomePage; test.beforeEach(({ page }) => { homePage = new HomePage(page); });` -> reassignable `let`, built even when unused, not shareable across files.
  ✔ fixture in `tests/fixtures/index.ts`
- ✘ `class BaseTest` / `class HomePage extends BasePage` -> inheritance pulls everything in; breaks "composition, no base classes".

5. **When OK:** `beforeEach` for a shared STEP in one file (e.g. `await homePage.goto()`); `new` in a throwaway experiment.
6. **Interview:** "Fixtures are Playwright's dependency injection: each test names what it needs, Playwright builds it before and cleans up after, only for tests that ask. We expose every page object as a fixture with test.extend, so specs never construct anything and setup lives in one file."

- **Later:** worker-scoped fixtures, `{ auto: true }`, fixture options, `mergeTests`.

### Fixtures: questions that came up

- **What is JS, TS, Playwright or ours in the fixtures file?** Walked through word by word in [walkthroughs.md](walkthroughs.md#fixtures). Summary: [PW] `test`, `extend`, `page`, `expect`, the `use` function, the fixtures idea. [TS] `type`, `: HomePage`, `<Fixtures>`. [JS] `import`, `as`, `export`, `const`, `async`, `await`, `=>`, `new`, `{ }` picking. [OURS] `base`, `Fixtures`, `homePage`..., the input name `use`, our `test`.
- **What is a type?** A description of what a value must look like. It never runs; `npm run typecheck` and VS Code check it. `Fixtures` is a type WE made: one object with 5 properties, each holding a specific page object. The name `Fixtures` can be anything; the property names (`homePage`...) are what specs write, so renaming them changes the specs.
  - ✘ `homePage: async ({ page }, use) => { await use(new SignInPage(page)); }` → ✔ `use(new HomePage(page))`
  - ✘ `async ({ homePge })` or `homePage.navBar.opnSignIn()` → ✔ `async ({ homePage })`, `homePage.navBar.openSignIn()`
- **Is `use` a Playwright function?** The FUNCTION is Playwright's (handed in as the 2nd input). The NAME `use` is ours, chosen by position (`giveToTest` would work the same). `page` inside `{ }` can NOT be renamed: braces pick by name (✘ `({ tab }, use)` → ✔ `({ page }, use)`).
- **Who writes it and who calls it?** `async ({ page }, use) => { ... }` is a function WE write. `({ page }, use)` are its inputs (parameters), not a function. Playwright CALLS it and supplies the two values. Same as a test body `async ({ signInPage }) => { ... }`.
- **Anonymous functions.** The fixture function and every test body are nameless arrow functions. Playwright finds the fixture one by its property name (`homePage:`) and the test one because we hand it to `test()`. Named functions (methods like `goto()`) are ones WE call later.
- **Function vs method.** A function is called on its own (`test(...)`, `expect(...)`); a method is called on an object with a dot (`signInPage.goto()`). `test` also carries methods: `test.describe`, `test.extend`. `expect(x)` returns an object; `.toBeVisible()` is a method on it.
- **More inputs?** Inside `{ }`, pick any existing fixture by name (`({ page, homePage }, use)`); an unknown name fails `npm run typecheck`. Slots after `{ }` are fixed by position: fixtures object, `use`, `testInfo`.
- **Another function in a fixture?** Not as an input (Playwright fills the slots). Yes inside the body: before `use` = setup, after `use` = cleanup. Or as another fixture. A fixture body only does what EVERY test using it needs (`goto()` stays in the test).
- **C# / SpecFlow:** fixtures are like SpecFlow hooks plus context injection, except each one is built only for tests that name it, and cleaned up after each test.

## Components and composition (Week 2 Day 1)

Docs: [Page object models](https://playwright.dev/docs/pom). Plan rule: composition over inheritance.

1. **What / problem:** the Main navigation is on every page. If its locators live in `HomePage`, the next page object that needs them copies them, and every copy must be fixed when the nav changes. A **component** is a small class for one part of the page that several pages share (`tests/components/NavBar.ts`).
2. **How (our app):** the page object HAS the component as a property and builds it in its own constructor:
   ```ts
   export class HomePage {
     readonly navBar: NavBar;
     constructor(private readonly page: Page) {
       this.navBar = new NavBar(page); // composition: HomePage HAS a NavBar
     }
   }
   // spec: await homePage.navBar.openSignIn();
   ```
   NavBar takes `page` as a plain input and does not store it: no NavBar method uses `this.page`.
3. **Recommended:** one component per shared part; page objects include only the parts they really have; the page object builds it, so the fixture stays `new HomePage(page)`.
4. **Alternatives (not used):**
   - ✘ `class HomePage extends BasePage` (inheritance, "is a"): every page gets everything in the base class, nav or not; only one parent class allowed. ✔ `readonly navBar: NavBar` (composition, "has a").
   - ✘ `constructor(private readonly page: Page, navBar: NavBar)` (passed in from outside, "dependency injection"): the fixture must become `new HomePage(page, new NavBar(page))`. Useful only when the caller must choose WHICH object goes in. ✔ build it inside.
   - ✘ copy the nav locators into every page object.
5. **When OK:** passing a component in is fine when different callers need different versions (e.g. a fake in a unit test).
6. **Interview:** "Shared parts of the UI are components that page objects include as properties, composition instead of a BasePage. Each page object only has the parts its screen really has, and a change to the nav is fixed in one class."

- **Naming:** components are PascalCase with no `Page` suffix (`NavBar`, not `NavBarPage`): `Page` means a whole screen you can `goto()`; a component is a part inside screens. Later component: `TopicLayout` (Week 3+).
- **Later:** components that take a root locator (`new Card(page.getByRole('article').nth(0))`) for repeated parts like list items.

## Checking a class, and the one CSS locator (Week 2 Day 1)

- **What the dark mode button does** (`webapp/js/app.js`): `document.documentElement.classList.toggle('dark-mode')`. Before: `<html lang="en">`; after: `<html lang="en" class="dark-mode">`. The app's CSS turns the page dark when it sees that class.
- **Locator:** `<html>` has no role, label or text, so no user-facing locator can find it. `page.locator('html')` = CSS selector by tag name. Allowed only when nothing user-facing exists ([Locators: CSS or XPath](https://playwright.dev/docs/locators#locate-by-css-or-xpath)). ✘ `page.locator('.primary-nav button')` (role + name exist) / ✔ `page.locator('html')`. Lives on the page object (`HomePage.htmlElement`), because specs hold no locators.
- **`locator()` itself** ([Locators: CSS or XPath](https://playwright.dev/docs/locators#locate-by-css-or-xpath)): a Playwright method on `page` (and on a Locator, for chaining) that finds elements by a **selector**, a text pattern. CSS by default; XPath also accepted (we never use it).
  - `page.locator('html')`: by tag name. `page.locator('#email')`: by id (`#`). `page.locator('.nav-icon-btn')`: by class (`.`). `page.locator('//button')`: XPath.
  - Returns a Locator, same as `getByRole`: `click()`, web-first `expect`, retries all work the same. Chaining: `this.mainNavigation.locator('button')` searches only inside the nav.
  - Why last resort: `getBy...` find elements the way a user sees them; `locator()` finds them by how the HTML is written, which breaks when a developer renames an id or class.
- **`toHaveClass` vs `toContainClass`** ([LocatorAssertions](https://playwright.dev/docs/api/class-locatorassertions)):
  - `toHaveClass('dark-mode')`: the WHOLE class attribute must be exactly `dark-mode`.
  - `toContainClass('dark-mode')` (Playwright 1.52+): `dark-mode` must be ONE OF the classes.
  - Example: `<html class="dark-mode large-text">` ✘ `toHaveClass('dark-mode')` fails / ✔ `toContainClass('dark-mode')` passes.
  - We use `toHaveClass` because `<html>` only ever has that one class today; if the app adds another, switch to `toContainClass`.
- **Check the start state first:** `await expect(homePage.htmlElement).not.toHaveClass('dark-mode')` before the click. It proves the click is what adds the class. Without it, a page that STARTED dark (e.g. leftover `tp_dark_mode` in localStorage) plus a button that does nothing would still pass the last check. With it, the test fails at the first line and says why. (Alan caught that "would pass on a page that was already dark" alone is wrong: the toggle would make it light and the last check would fail.) Each test gets a fresh browser context (empty localStorage), so the page always starts light.
- **Finding role and name in Chrome:** right-click → Inspect → Accessibility tab → Computed properties: Role `button`, Name `"Toggle dark mode"` (from `aria-label`; the 🌙 contents are crossed out because aria-label wins). "Show accessibility tree" switches the Elements view to roles; turn it off to see HTML again.
