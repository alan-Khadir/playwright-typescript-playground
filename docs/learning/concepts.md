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

### Why not data-testid? Worked examples (Week 2 Day 2)

The question every team asks: "Test ids never break on a text change. Why not use them everywhere?" Short answer: **a test id checks an attribute users never see; a user-facing locator checks what the user actually gets.** The examples below show the difference on real HTML. Where our app has the element, the HTML is copied from `webapp/`; where it doesn't, the example is marked _(made up)_.

Each example: the HTML today → a realistic bad change (✘) → what each locator does.

**1. `getByRole`: a button becomes a clickable div** (`webapp/html/signin.html`, line 42)

```html
<!-- Today -->
<button type="submit" data-testid="signin-submit-button">Sign In</button>
<!-- ✘ After a "restyle" -->
<div class="btn" data-testid="signin-submit-button" onclick="submitForm()">
  Sign In
</div>
```

A `<button>` comes with role `button` (screen readers say "Sign In, button"), a Tab stop, Enter/Space to press, and form submit. A `<div>` has none of these: it still works with a mouse, but a keyboard or screen reader user can't use it.

| Locator                                           | On the ✘ HTML                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| ✔ `page.getByRole('button', { name: 'Sign In' })` | finds nothing (no role) → `click()` times out → **test fails, bug caught** |
| ✘ `page.getByTestId('signin-submit-button')`      | finds the div, click works → **test passes, bug ships**                    |

Same the other way: the text changes to "Log in" → ✔ fails (a user sees the change too), ✘ passes.

**2. `getByLabel`: the label is unlinked from its input field** (`webapp/html/signin.html`, lines 38–39)

```html
<!-- Today: for="email" matches id="email", so the field's name is "Email" -->
<label for="email">Email</label>
<input type="email" id="email" required data-testid="signin-email-input" />
<!-- ✘ Someone renames the id; the label now points at nothing -->
<label for="email">Email</label>
<input type="email" id="user-email" required data-testid="signin-email-input" />
```

Screen readers now announce "edit text" with no name, and clicking the word "Email" no longer puts the cursor in the field.
✔ `getByLabel('Email')` finds nothing → fails, bug caught. ✘ `getByTestId('signin-email-input')` → passes.

**3. `getByText`: wrong message shown** (`#signin-error` on the sign-in page)

```html
<!-- Today, after a wrong password -->
<div id="signin-error" ... data-testid="signin-error">
  Invalid email or password.
</div>
<!-- ✘ A bug shows the wrong text (or an empty box) -->
<div id="signin-error" ... data-testid="signin-error">undefined</div>
```

✔ `getByRole('main').getByText('Invalid email or password.')` → fails. ✘ `getByTestId('signin-error')` + `toBeVisible()` → passes (the box is there, the message is wrong).

**4. `getByPlaceholder`: the hint disappears** (`webapp/html/create-account.html`, line 40)

```html
<!-- Today -->
<input
  type="text"
  id="full-name"
  placeholder="Enter your full name"
  required
  data-testid="signup-fullname-input"
/>
<!-- ✘ Placeholder removed in a redesign; the user no longer sees what to type -->
<input
  type="text"
  id="full-name"
  required
  data-testid="signup-fullname-input"
/>
```

✔ `getByPlaceholder('Enter your full name')` → fails. ✘ test id → passes. (Prefer `getByLabel` when the field has a label: a placeholder disappears as soon as you type, so it's a weaker name.)

**5. `getByAltText`: an image loses its text alternative** (footer logo, built in `webapp/js/app.js`)

```html
<!-- Today -->
<img src="..." alt="Testing Playground logo" class="footer-logo" />
<!-- ✘ alt removed: screen readers read the file name, or nothing -->
<img src="..." class="footer-logo" data-testid="footer-logo" />
```

✔ `getByAltText('Testing Playground logo')` → fails. ✘ test id → passes.

**6. `getByTitle`: an icon's tooltip is lost** _(made up: our app has no `title` attributes)_

```html
<!-- Today -->
<span title="Topics explored" data-testid="explored-count">7</span>
<!-- ✘ title removed: hovering shows nothing, the number has no meaning -->
<span data-testid="explored-count">7</span>
```

✔ `getByTitle('Topics explored')` → fails. ✘ test id → passes.

**The pattern:** in every example the user-facing locator fails exactly when a real user would be hurt, and the test id passes. A test id only fails when someone deletes the test id.

#### What an accessible app gives the tests, and the team

- **Free accessibility checks.** Every passing `getByRole` / `getByLabel` / `getByAltText` proves something a screen reader or keyboard user relies on: the button is a real button, the field has a name, the image has a text alternative. A test id proves none of this.
- **No extra attributes to maintain.** If the app uses proper HTML (labels, buttons, headings, alt text), the locators already exist. Nobody adds, names, documents or keeps `data-testid` attributes in sync with the tests.
- **Tests read like the user's steps.** `getByRole('button', { name: 'Sign In' })` is what a manual tester writes in a test case. Easier to review, easier for a new person to read.
- **The same names serve everyone.** Screen readers, voice control ("click Sign In") and Playwright all use the accessible name. One correct name serves all three.
- **Legal duty.** UK service providers must make reasonable adjustments for disabled people under the [Equality Act 2010](https://www.gov.uk/guidance/meet-the-requirements-of-equality-and-accessibility-regulations); public sector websites must also meet WCAG 2.2 AA under the [Public Sector Bodies Accessibility Regulations 2018](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps). Companies selling into the EU also fall under the European Accessibility Act (applies from 28 June 2025). Tests that use the accessibility tree catch some of these failures early. (Checked 2026-11-17; not legal advice.)
- **The limit.** Role locators only check what a test touches. A full check of a page (contrast, missing labels on fields no test uses) needs an accessibility scanner: `@axe-core/playwright`, Week 10.

#### The honest counter-case: when a test id is the right choice

- **Text that changes on purpose:** an app translated into several languages, or copy the marketing team rewrites often. A text-based locator then breaks for no user-facing reason. (Middle ground: keep the role, change only the name per language.)
- **No stable user-facing handle:** a chart, a canvas, an icon with no text or label, a list row whose text is random data.
- **Two identical elements** that only differ by position, where chaining inside a region (`getByRole('main')...`) still can't tell them apart.
- **Cost of choosing test ids:** they don't catch broken labels, roles, text or alt text (examples above), and someone has to add and maintain them in the app.

#### How to answer when someone asks "why not just use data-testid?"

"Test ids are stable, but they only prove an attribute exists, one users never see. A role or label locator proves the user can actually find and use the element: if a button turns into a div, or a label stops pointing at its field, our test fails before a customer does. So I use user-facing locators first, and keep test ids for elements with no stable text or role, like charts or translated copy."

Docs: [Locators](https://playwright.dev/docs/locators), [Best practices: use locators](https://playwright.dev/docs/best-practices#use-locators).

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

- **Scope** (Week 2 Day 5): test scope (the default, all of ours): built fresh for each test that asks for it, thrown away after. Worker scope (`[fn, { scope: 'worker' }]`): built once per worker (one of the parallel processes running tests) and shared by its tests; only for things that don't hold a tab, e.g. one test account per worker. Page objects can't be worker-scoped: they're built from `page`, which is per test. [Docs](https://playwright.dev/docs/test-fixtures#worker-scoped-fixtures)
- **Later:** `{ auto: true }` (Week 8), fixture options, `mergeTests`.

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
- **`toHaveCSS('color', 'rgb(…)')`** checks one computed style value. Not used: the class is what our app toggles, so `toHaveClass` checks the cause; exact colours are brittle.
- **Check the start state first:** `await expect(homePage.htmlElement).not.toHaveClass('dark-mode')` before the click. It proves the click is what adds the class. Without it, a page that STARTED dark (e.g. leftover `tp_dark_mode` in localStorage) plus a button that does nothing would still pass the last check. With it, the test fails at the first line and says why. (Alan caught that "would pass on a page that was already dark" alone is wrong: the toggle would make it light and the last check would fail.) Each test gets a fresh browser context (empty localStorage), so the page always starts light.
- **Finding role and name in Chrome:** right-click → Inspect → Accessibility tab → Computed properties: Role `button`, Name `"Toggle dark mode"` (from `aria-label`; the 🌙 contents are crossed out because aria-label wins). "Show accessibility tree" switches the Elements view to roles; turn it off to see HTML again.

## Auth and storage state (Week 2 Day 2)

Docs: [Authentication](https://playwright.dev/docs/auth), [Projects](https://playwright.dev/docs/test-projects).

### What we did today, and why (the short story)

1. **The problem.** The dashboard only shows the topic grid to a signed-in user. Every Playwright test starts in a new, empty **browser context** with a new tab in it. Empty for every app, sign-in or not: no cookies, no localStorage. In OUR app, empty means no `authToken`, so every test starts **signed out**. To test anything behind sign-in, each test would have to fill in the sign-in form first: slow, repeated in every test, and one sign-in bug would fail every test.
2. **The fix.** Sign in **once per run** (not once per test), before any chromium test starts, and save what the browser remembers about being signed in into a file. Then every test starts with that file loaded, so it starts signed in without touching the form.
3. **What we built:**
   - `tests/auth.setup.ts`: signs in through the form (our `SignInPage`), waits until the dashboard shows, then saves the file `playwright/.auth/user.json`.
   - `playwright.config.ts`: a new project `setup` that runs that file first; the `chromium` project loads the saved file into every test and depends on `setup`.
   - `sign-in.spec.ts`: its tests now start **signed out** on purpose (`test.use(...)`), because they test the form itself.
   - `DashboardPage`: `goto()` and `topicCards`.
   - `dashboard.spec.ts`: signed out → sent to sign in; signed in → sees 4 topic cards.
   - The saved file is **not** committed: `.gitignore` already lists `/playwright/.auth/` (line 156, added by the Playwright installer in Week 1). Proof: `git check-ignore -v playwright/.auth/user.json`.

### Words used here

- **Browser context** [PW]: the fresh, isolated browser profile Playwright gives each test. Its own cookies and localStorage, nothing shared with other tests. Like a new private window. The browser **program** is shared between the tests of one worker (starting it is slow); each test gets a new **context** (cheap) and a new tab (`page`) inside it. Docs: [Browser contexts](https://playwright.dev/docs/browser-contexts).
- **localStorage** [JS, browser]: small key/value storage a website keeps in the browser. Survives page reloads.
- **sessionStorage** [JS, browser]: the same, but cleared when the tab closes. Storage state does **not** save it.
- **Storage state** [PW]: a JSON file holding a context's cookies and localStorage. Saved with `page.context().storageState({ path })`, loaded with the `storageState` option. "Storage state" is **Playwright's** name (the method and the option), not the browser's. The folder `playwright/.auth/` and the file name `user.json` are **ours**, following the docs' example.
- **Project** [PW]: a named group of tests in `playwright.config.ts` with its own settings (`setup`, `chromium`).
- **Dependency** [PW]: `dependencies: ['setup']` = run the `setup` project first; if it fails, don't run this one.

### 1. What and why

Our app decides "signed in" by one value. On sign-in, `webapp/js/app.js` does:

```js
localStorage.setItem('authToken', 'mock-jwt-token-12345');
```

and the dashboard checks it (lines 882–884):

```js
if (!localStorage.getItem('authToken')) {
  showToast('⚠️ Please log in to access the dashboard.', 'error');
  window.location.href = 'signin.html?redirect=dashboard';
```

Every new browser context has empty localStorage → no `authToken` → signed out. Storage state lets us put `authToken` back into every context without using the form.

### 2. How it works in our app: one run, step by step

When you run `npm test`:

1. Playwright sees that `chromium` depends on `setup`, so it runs the **setup project first**. It only runs files ending in `.setup.ts` → `tests/auth.setup.ts`.
2. Setup signs in through the form, waits until the dashboard URL and heading appear, then **writes** `playwright/.auth/user.json` (it creates the file and folders itself). Its browser context then closes.
3. The **chromium project** starts. For **each** test, Playwright opens a new context and loads `user.json` into it, so `authToken` is already in localStorage.
4. Each test starts **signed in, but on a blank tab** (`about:blank`). Storage state restores what the browser remembers, not where it was. So the test still opens its page: `await dashboardPage.goto()`.
5. Tests that must start signed out override it: `test.use({ storageState: { cookies: [], origins: [] } })` = an empty state instead of the file.

What the saved file contains (ours, 2026-11-17):

```json
{
  "cookies": [],
  "origins": [
    {
      "origin": "http://localhost:3000",
      "localStorage": [
        { "name": "authToken", "value": "mock-jwt-token-12345" },
        { "name": "tp_streak_dates", "value": "[\"2026-11-17\"]" }
      ]
    }
  ]
}
```

- `cookies` is empty: our app uses none.
- All localStorage is saved, not just the token (`tp_streak_dates` came along).
- `tp_username` is missing: the app keeps it in **sessionStorage**, which storage state doesn't save. So signed-in tests won't see the user's name in the nav. No test needs it yet.

### 3. Recommended way

A **setup project** + `dependencies` + `storageState` in the config (what we did). The sign-in step shows in the HTML report and trace like any test, it can use our fixtures and page objects, and if sign-in breaks, setup fails once with a clear error instead of every test failing.

### 4. Alternatives, and what goes wrong

- ✘ **`globalSetup`** (older way): a plain script run before the tests. No trace, no report entry, no fixtures, so harder to debug.
- ✘ **Sign in through the form in every test** (`beforeEach`): slow; one sign-in bug fails every test; the sign-in screen gets tested 50 times by accident.
- ✘ **Write `authToken` by hand** (hard-code the state in the config, or `addInitScript`): fastest, but never proves sign-in works. If the app changes how it stores the token, every test still passes while real users can't sign in.
- **Sign in through an API call**: the best option when the app has an auth API (faster than the form, still real). Ours has none.

### 5. When an alternative is OK

- **Form sign-in in the test itself:** when sign-in IS the feature under test, e.g. `sign-in.spec.ts`. Those tests start signed out and use the form.
- **API sign-in:** once an app has an auth endpoint.
- **One account per worker** (tests running in parallel each get their own account): when tests change server-side data for the user. Not needed here: our state is per browser.

### 6. Interview answer

"I sign in once in a setup project and save the browser's cookies and localStorage as storage state; every test project depends on it and starts already authenticated. That keeps tests fast and independent, and only the sign-in tests themselves go through the form, starting from an empty state."

**Advanced, later:** one state file per role (admin, user); one account per parallel worker; saving IndexedDB too (`storageState({ path, indexedDB: true })`).

**SpecFlow / Cucumber:** the closest is a hook that runs once before all tests: SpecFlow `[BeforeTestRun]`, Cucumber `BeforeAll`. You'd sign in there and save the cookies to a file. Differences: a hook isn't a test, so it has no report entry or trace; Playwright's `globalSetup` is the direct equivalent of those hooks, and the setup project goes one step further. `[BeforeScenario]` / `Before` is per scenario = `beforeEach` (sign in every test: the slow option). In Week 6, playwright-bdd scenarios run as Playwright tests, so they use this same setup project.

**C# / Selenium:** no built-in equivalent. You'd sign in in a `[BeforeScenario]` hook, or add cookies with `driver.Manage().Cookies.AddCookie(...)`. ⚠ Watch out: in Selenium you must open the site before setting cookies, and localStorage needs `ExecuteScript`. Playwright loads both into the context before the first page opens.

### Questions that came up (Week 2 Day 2)

- **If setup signs in, why keep the sign-in tests?** Setup **uses** sign-in; the spec **tests** it. Setup never tries a wrong password, so without `sign-in.spec.ts` nothing checks the error message. And if sign-in broke, setup would fail with "setup failed" and skip everything, not a named test saying which feature broke. Rule: test a feature through the UI once, in its own spec; every other test gets past it with storage state.
- **Why do the sign-in tests need `test.use(...)` now?** Since `chromium` loads `user.json`, every test starts signed in, including these. A real user isn't signed in when they sign in. If the app ever sent signed-in users away from the sign-in page, these tests would break for the wrong reason.
- **Why does the signed-in test still call `goto()`?** It starts signed in but on a blank tab. The sign-in that landed on the dashboard happened in setup's context, which closed after saving.
- **Signing out lands on `/html/signin.html`, so why does the test expect `?redirect=dashboard`?** Two different paths in the app. Sign out (`app.js` line 1173) → `signin.html`. The dashboard guard (line 884) → `signin.html?redirect=dashboard`. Our test opens the dashboard while signed out, so it hits the guard. The `?redirect` part proves the guard fired AND remembered where the user was going (after sign-in, lines 1242–1244 send them back).
- **Does "empty" mean only that `authToken` is missing?** No. Every new context is completely empty (no cookies, no localStorage) for any app. Missing `authToken` is what that means for OUR app: signed out.
- **Does setup run before each test?** No: once per run, before the chromium project starts. Every test then loads the same saved file into its own new context.
- **Is `setup` Playwright's `test`?** It's our `test` from `tests/fixtures`, which is Playwright's `test` extended with our fixtures (`base.extend` in `fixtures/index.ts`). So it has everything Playwright's has (`page`, `test.use`, `test.describe`) plus `signInPage`, `dashboardPage`. `as setup` only renames it in this file.
- **What if setup and the config name different files?** Setup WRITES the path in `authFile`; the config's `storageState` READS its path. If they differ (e.g. config says `playwright/.auth/admin.json`), setup passes but every chromium test fails before it starts with an error reading the storage state file (ENOENT: no such file or directory).
- **Who creates `user.json`?** Playwright, when setup's last line runs: `await page.context().storageState({ path: authFile })`. You never create it by hand.
- **Why `expect` before saving?** It makes setup wait until sign-in has really finished. Saving earlier could store a signed-out state; setup would pass and the dashboard tests would fail with a confusing error.
- **Why `.setup.ts` and not `-setup.ts`?** The setup project's `testMatch: /.*\.setup\.ts/` only matches names ending in `.setup.ts`. With a dash, setup silently doesn't run (we saw 6 tests instead of 7).
- **Why does the signed-out dashboard test sit in its own `describe`?** `test.use` applies to its group: the `describe` it's in, or the whole file if it's at the top. The describe keeps the empty state on the signed-out test only. ✘ With `test.use({ storageState: { cookies: [], origins: [] } })` at the top of `dashboard.spec.ts`, the signed-in test would also start signed out, be sent to sign in, and fail on `toHaveCount(4)`. (Week 2 Day 3)
- **Signed-in tests land on `signin.html?redirect=dashboard` (Week 2 Day 5 drill).** Stale `user.json`. localStorage belongs to one **origin** (scheme + host + port), so a file saved for `http://127.0.0.1:3000` gives nothing on `http://localhost:3000`. Normally setup rebuilds the file every run; `--no-deps` skips setup, so the old file is used. Fix: run without `--no-deps`. ✘ Not: sign in in every test, retries, waits, hand-editing or committing the file.

---

## Search, filtering and the loader (Week 2 Day 3)

What we built: dashboard search and clear tests, and "opening a topic shows a loader, then the topic". Our code line by line: [walkthroughs: Dashboard search and TopicLayout](walkthroughs.md#dashboard-search-and-topiclayout-week-2-day-3).

### Accessible name: where it comes from

The browser gives every element one **accessible name** (what a screen reader says). It checks these sources in order and takes the first that has a value:

`aria-labelledby` → `aria-label` → `<label>` → `title` → `placeholder`

- Our search box: `<input type="search" placeholder="Search topics..." aria-label="Search topics">`. The name is "Search topics" (from `aria-label`). DevTools → Accessibility crosses out the placeholder: it exists but was ignored, because a source higher in the list won. "Not specified" = the element doesn't have that source.
- Some roles never take their name from their text. A `status` element (our loader) only gets a name from `aria-label` / `aria-labelledby`, so `getByRole('status', { name: 'Loading...' })` finds nothing. Use `filter({ hasText })` instead (below).

**`getByLabel` matches `aria-label` too.** Playwright's getByLabel finds an input field by its `<label>`, by `aria-labelledby`, or by the `aria-label` attribute ([getByLabel](https://playwright.dev/docs/api/class-page#page-get-by-label)). So `getByLabel('Search topics')` works on our search box. We use `getByRole('searchbox', { name: 'Search topics' })`, because it also checks the role.

```ts
// ✘ A placeholder is a hint, not a name: it disappears when you type and screen readers may skip it.
page.getByPlaceholder('Search topics...');
// ✔ Role + accessible name, like a screen reader user finds it.
page.getByRole('searchbox', { name: 'Search topics' });
```

**What `aria-label` is for.** It's invisible on screen (no tooltip; `title` does that). Screen readers, voice control ("click Clear search") and tools that read the accessibility tree (Playwright's getByRole and getByLabel) use it.

- ✔ Use it when there is no visible text: our ✕ button is `aria-label="Clear search"`. Without it, a screen reader says just "button" and `getByRole('button', { name: 'Clear search' })` finds nothing.
- ✘ Don't put it on a button that already shows text: it replaces that text, so what the screen reader says no longer matches the screen.

### Heading levels

`<h1>` to `<h6>` rank headings in the page outline (`h1` = the page's main title). The browser turns `<hN>` into role `heading` with level N (DevTools: "Role: heading, Level: 1"). `getByRole('heading', { level: 1 })` matches the `h1` and never an `h3` ([level option](https://playwright.dev/docs/api/class-page#page-get-by-role-option-level)).

We use `level: 1` with no name in `TopicLayout`, because all 10 topic pages share it and each has a different title. The spec checks which title: `await expect(topicLayout.heading).toHaveText('Space Exploration')`. A fixed name in the component would work for one topic only; on any other it would time out with "element not found" instead of "expected X, received Y".

### Filtering locators: `has` and `hasText`

`filter()` keeps only the elements, out of the ones a locator found, that pass a test ([Filtering locators](https://playwright.dev/docs/locators#filtering-locators)).

| Option            | Keeps the ones that...       | Our code                                                                           |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| `has: <locator>`  | contain a matching element   | `this.topicCards.filter({ has: this.page.getByRole('heading', { name: title }) })` |
| `hasText: 'text'` | contain that text (any part) | `page.getByRole('status').filter({ hasText: 'Loading...' })`                       |

Why `openTopic` filters: a card's accessible name is **all** its text ("🚀 Space Exploration TECHNOLOGY ADVANCED 🏆 30pts What would happen... New"), and the header's "Topics navigation" has a link called "Space Exploration" too.

```ts
// ✘ Matches the header link AND the card: strict mode violation on click().
page.getByRole('link', { name: 'Space Exploration' });
// ✔ Only links inside <main> (the cards), then the one containing that heading.
this.topicCards.filter({
  has: this.page.getByRole('heading', { name: title }),
});
// ✔ Also fine: chain to the heading inside the card and click it (the click lands inside the link).
//   Shorter, but it returns the heading, not the card.
this.topicCards.getByRole('heading', { name: title });
```

**Reading the docs.** In Playwright's docs, `locator.filter()` means "call `filter` on **any** Locator": `locator` is a placeholder, not code to type. Likewise `page.goto()` is our `this.page.goto(...)`.

```ts
// ✘ Typed the placeholder: `locator` is a method on a Locator, so this has no `filter`.
this.topicCards.locator.filter({ ... });
// ✔
this.topicCards.filter({ ... });
```

A locator only **describes** what to find; nothing happens in the browser until you call an action (`click()`, `fill()`) or an assertion on it.

### Actions: `fill`, `clear`, `click`

- `fill(text)`: empties an input field and types the text in one go, firing the `input` event. Our dashboard filters on that event, so `fill` triggers the search.
- `clear()`: empties an **input field**. On a button it fails ("Element is not an input...").
- `click()`: what a user does to the ✕ button. `clearSearch()` clicks it.

Source: [Actions](https://playwright.dev/docs/input).

### Checking a list: `toHaveText([...])` vs `toContainText([...])`

`[ ... ]` is an **array** [JS]: a list of values in order. `['Space Exploration']` has one string; its type [TS] is `string[]`.

| Assertion on a locator that finds several elements | Checks                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `toHaveText(['A', 'B'])`                           | **exactly** 2 elements, in that order, each text **equal** to A, B                                |
| `toContainText(['A', 'B'])`                        | **some** elements contain A, then B, in order; extra elements allowed; part of the text is enough |
| `toHaveText('A')` (no array)                       | exactly **one** element; 2 matches = strict mode violation                                        |

Source: [toHaveText](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-text), [toContainText](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-contain-text).

Which **locator** you assert on decides which text is read: `topicCards` reads each whole card; `topicTitles` reads only each card's `<h3>`.

```ts
// ✘ Passes even if the search filtered NOTHING: Space Exploration is one of the 4 titles, extras are allowed.
await expect(dashboardPage.topicTitles).toContainText(['Space Exploration']);
// ✘ Reads the whole card: passes if "Space Exploration" appears in another card's description.
await expect(dashboardPage.topicCards).toContainText('Space Exploration');
// ✔ Exactly one card, and its title is exactly "Space Exploration".
await expect(dashboardPage.topicTitles).toHaveText(['Space Exploration']);
```

Search for part of a word in lower case (`'space'`): that's what users type, and it proves more than searching for the full title.

### Waiting for a loader: assertions, not waits

Opening a topic shows `<div role="status">...Loading...</div>` for about 1.2 s, then the topic. (The dashboard grid itself has no loader: it fades in 150 ms after loading `topics.json`, which `toHaveCount` already waits for.)

```ts
await dashboardPage.openTopic('Space Exploration');

await expect(topicLayout.loadingSpinner).toBeVisible(); // re-checks until it shows
await expect(topicLayout.loadingSpinner).toBeHidden(); // re-checks until it's gone (or not in the page)
await expect(topicLayout.heading).toHaveText('Space Exploration');
```

- `toBeHidden` **is** the wait: it moves on the moment the loader goes, and fails after 5 s if it never does (a stuck loader is a bug the test should catch). ([toBeHidden](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-hidden))
- ✘ `await page.waitForTimeout(1200)`: always waits 1.2 s, even when the app is faster, and fails when the app is slower.
- `await locator.waitFor({ state: 'hidden' })` [PW]: a pure wait with no check. Only where you must wait but not assert, e.g. inside a page-object method (page objects hold no `expect`). In specs use `toBeHidden()`.
- Strictly, the `toHaveText` line alone would also wait past the loader. `toBeHidden` is there to **prove** the loader goes away.

**C# / Selenium:** `new WebDriverWait(driver, TimeSpan.FromSeconds(5)).Until(ExpectedConditions.InvisibilityOfElementLocated(By.CssSelector(".loading-spinner")))`. Same polling idea, but you build it yourself and a timeout throws `WebDriverTimeoutException` without saying what you expected. ⚠ Watch out: Playwright has no global `ImplicitWait`; actions auto-wait for the element and assertions auto-retry.

**Interview line:** "I never sleep for a loader. I assert it becomes visible, then hidden, then assert the content; each web-first assertion retries until true, so the test is as fast as the app and fails clearly if the loader never goes away."

### Seeing a short-lived element

Loaders and toasts disappear in seconds. Ways to freeze or replay them (nothing in `webapp/` changes):

- **DevTools breakpoint (loader):** Sources → `Ctrl+P` `app.js` → `Ctrl+G` 977 (the `await simulateDelay(1200)` line right after the loader is added) → click the line number → reload. The page freezes with the loader on screen; inspect it in Elements. Remove the breakpoint and press F8 to resume. Nothing in `webapp/` changes.
- **F8 pause (toast, ~3 s):** DevTools open on Sources, form filled. Click the page's button, then straight away click blank space inside DevTools and press F8, all within ~3 s. F8 only works when focus is in DevTools. The page pauses at the next JavaScript (the timer that hides the toast), so the toast stays; "Paused in debugger" shows. F8 again resumes.
- **Reliable pause:** in the Console run `setTimeout(() => { debugger; }, 2000);`, then click the button within 2 s; the page freezes 2 s later. Or set a breakpoint on the `showToast(...)` line in `app.js` (Ctrl+F `showToast`) and step with F10.
- **Trace viewer:** `npx playwright test --trace on` (overrides the config's `trace` for this one run), then `npx playwright show-report` → the test → Traces → click a step → **After** tab = the page just after that step. "Pick locator" tries a locator on that snapshot; or open the snapshot in its own window and use F12.
- **Failure screenshots:** `screenshot: 'only-on-failure'` in the config (Week 3 Day 1) attaches the page at the moment of failure to the HTML report.

### Tests that survive content changes (for later)

Our tests use fixed titles ("Space Exploration"). That's right here: `topics.json` is in our repo, so a rename comes in a PR and a failing test is the right signal. In an app whose content comes from a CMS, teams **control the data** instead: mock the content response (`page.route`, Week 7) or seed a test environment with known content. Reading the data from the page at run time (search for whatever the first card is called) survives renames but is weaker and can pass for the wrong reason. Covered in Week 3 Day 2 (test data) and Week 7 (mocking).

---

## Tags and environment variables (Week 2 Day 3)

What we built: `@smoke` / `@regression` tags on every test, and `BASE_URL` read from a `.env` file. Rules: [architecture: Tags](../architecture.md#tags) and [Environment variables](../architecture.md#environment-variables). Our code line by line: [walkthroughs: Tags and BASE_URL](walkthroughs.md#tags-and-base_url-week-2-day-3-part-2).

### Tags

**What and why.** A tag is a label on a test, so a run can pick a group by name instead of by file. Two groups matter to us:

- **Smoke**: "is the app basically alive?". A few fast tests on the paths the app is useless without. Run on every PR (from Week 9), so feedback comes in seconds.
- **Regression**: every test. Run nightly (from Week 9), where time matters less than coverage.

**How, in our code** [PW]: a details object between the title and the function ([Tag tests](https://playwright.dev/docs/test-annotations#tag-tests)). Tags must start with `@`.

```ts
// On a describe: every test inside gets @regression.
test.describe('Sign in', { tag: '@regression' }, () => {
  // On a test: adds @smoke, so this test has both.
  test('valid user reaches the dashboard', { tag: '@smoke' }, async ({ ... }) => {
  // No tag of its own: it still has @regression from the describe.
  test('wrong password shows the error', async ({ signInPage }) => {
```

**Running a group** [PW]:

```powershell
npx playwright test --grep '@smoke'          # only tests whose title or tags match @smoke (+ setup)
npx playwright test --grep-invert '@smoke'   # everything EXCEPT @smoke
npx playwright test --grep '@smoke' --list   # show what would run, run nothing
npm run test:smoke                           # [OURS] the same as the first line, from package.json
```

- `--grep` is a regular expression matched against the test's full title **and** its tags. `"@fast|@slow"` = either tag.
- Tests picked by `--grep` still bring their **dependency projects**: `setup` runs first even though it has no tag ([Project dependencies](https://playwright.dev/docs/test-projects#dependencies)). `--no-deps` would skip it.

✘ / ✔ in PowerShell:

```powershell
npx playwright test --grep @smoke     # ✘ PowerShell reports: The variable '$smoke' cannot be retrieved because it has not been set.
npx playwright test --grep '@smoke'   # ✔ quoted: PowerShell passes the text @smoke to Playwright
```

In PowerShell `@name` means "splatting": pass the variable `$name` as arguments. Quotes make it plain text. Bash (CI) doesn't need them, but they work there too. npm scripts don't need them either: npm runs scripts with cmd.exe on Windows and sh on Linux.

**Recommended way.** `@regression` once per describe, `@smoke` on a handful of tests, chosen by "if only this test failed, would we block the merge?". Run smoke through `npm run test:smoke`.

**Alternatives, and what goes wrong:**

- Separate folders (`tests/smoke/`, `tests/regression/`): moving a file changes its category, and a test can't be in both.
- A Playwright project per group (`testMatch` on folders): the same problem, plus a duplicated project setup.
- The tag inside the title (`'valid user reaches the dashboard @smoke'`): the older style; it still works, but mixes the test's name with its label.
- `@regression` written on every test: easy to forget one, and that test silently drops out of the nightly run.

**When an alternative is OK.** Many teams don't use `@regression` at all: nightly simply runs everything with no `--grep`. The tag earns its place once some tests must be kept out of the nightly run (e.g. `@visual`).

**Interview answer.** "I tag a small, fast set of critical-path tests `@smoke` and run them with `--grep` on every pull request; the full regression suite runs nightly. Tags are set on the test or its describe block, so a test's group doesn't depend on which folder it lives in."

**Advanced, later:** tags for run types (`@visual`, `@slow`) excluded with `--grep-invert`; `grep` / `grepInvert` set per project in the config; annotations (`test.fail`, `test.fixme`) for known bugs.

**C# / Selenium / SpecFlow:** NUnit `[Category("Smoke")]` and `dotnet test --filter TestCategory=Smoke`; SpecFlow `@smoke` on a scenario or feature becomes the same category. ⚠ Watch out: SpecFlow's feature-level tag is inherited by scenarios like our describe-level tag, but `--grep` is a regular expression, not an exact category name: `--grep @smoke` would also match a tag called `@smoke-extra`.

### Environment variables and .env

**What and why.** An **environment variable** is a named value that the shell or CI gives to a program from outside the code. Node puts all of them in `process.env` [Node]. The app's address used to be written into the config; now it comes from `BASE_URL`, so the same tests can run against another address without editing code.

A **.env file** is a text file of `NAME=value` lines. The **dotenv** package [Node-npm] reads it into `process.env` when the config loads.

| File           | Committed?      | Read by code?             | Holds                                                    |
| -------------- | --------------- | ------------------------- | -------------------------------------------------------- |
| `.env`         | No (gitignored) | Yes, by `dotenv.config()` | Your values, later also secrets                          |
| `.env.example` | Yes             | No                        | Every variable name with a safe sample value, for others |

A newcomer runs `Copy-Item .env.example .env` once and edits their copy. Today `.env` is optional: every variable has a default.

**How it decides, in order:**

1. A variable already set in the shell or by CI (`$env:BASE_URL='http://localhost:3003'`). dotenv never overwrites a value that's already set.
2. `BASE_URL=` in `.env`, if it isn't empty.
3. The default in the config: `process.env.BASE_URL || 'http://localhost:3000'`.

In CI there is no `.env` (it's never committed) and the workflow sets no `BASE_URL`, so step 3 gives `http://localhost:3000`, the app `webServer` starts there.

```ts
baseURL: process.env.BASE_URL ?? 'http://localhost:3000',  // ✘ ?? only replaces undefined/null: BASE_URL= (empty) gives '' and every goto breaks
baseURL: process.env.BASE_URL || 'http://localhost:3000',  // ✔ || also replaces an empty string
```

`process.env.BASE_URL` has the type `string | undefined` [TS]: `undefined` when the variable isn't set anywhere.

**Recommended way.** Read variables only in `playwright.config.ts`, give each a safe default, commit `.env.example`, never `.env`. Secrets (later) get no default: the run should stop with a clear message if one is missing.

**Alternatives, and what goes wrong:**

- Hard-coded `baseURL: 'http://localhost:3000'`: simplest, no package, but changing the address means editing code, and everyone (CI too) is stuck with one value.
- Node's built-in `process.loadEnvFile('.env')` (Node 20.12+): no package, but it **throws** when `.env` is missing, so CI needs an extra check around it.
- `process.env` read inside tests or page objects: settings spread across files; one place (the config) is easier to find and to default.
- One config file per environment (`playwright.staging.config.ts`): duplicates the whole config for one changed value.

**When an alternative is OK.** Hard-coded is fine for one local app with one address, which was us until Week 2 Day 3.

**Interview answer.** "Environment-specific settings like the base URL come from environment variables, loaded from a gitignored .env locally and set by the pipeline in CI, with a safe default in the config. A committed .env.example documents every variable, so secrets never reach the repo."

**Advanced, later:** CI sets `BASE_URL` per job (Week 9); secrets from GitHub Actions secrets; validating required variables at config load; `webServer` skipped when `BASE_URL` points at a deployed app.

**C#:** `appsettings.json` + `appsettings.{Environment}.json` + environment variables through `IConfiguration`, or `.runsettings` parameters (`TestContext.Parameters`). ⚠ Watch out: in .NET, environment variables usually override the JSON files, like our order; but .NET has no `.env` convention built in, and `appsettings.json` is normally committed, so secrets go in user secrets instead.

---

## Create account form (Week 3 Day 1)

Our code: [walkthroughs: CreateAccountPage](walkthroughs.md#createaccountpage), [Toast](walkthroughs.md#toast), [create account spec](walkthroughs.md#create-account-spec).

### `Partial<T>` and `!== undefined`

1. **Kind / from:** a **utility type**, TypeScript-only (removed when the code runs).
2. **What:** `Partial<T>` builds a new type from `T` in which every property is optional, as if each had `?`. Each property's type gains `| undefined`.
3. **How (our code):**
   ```ts
   export type AccountDetails = { fullName: string; email: string; password: string; confirmPassword: string; acceptTerms: boolean };
   // Partial<AccountDetails> is { fullName?: string; email?: string; ...; acceptTerms?: boolean }

   async createAccount(details: Partial<AccountDetails>): Promise<void> {
     if (details.email !== undefined) {
       await this.emailInput.fill(details.email); // inside the if, email is string, not string | undefined
     }
     ...
   }
   // spec: createAccount({})  createAccount({ email: 'fred.test.com', acceptTerms: true, ... })
   ```
4. **Why the `if`:** `fill()` accepts only a `string`. Without the `if`, `npm run typecheck` reports `Argument of type 'string | undefined' is not assignable to parameter of type 'string'.` The `if` **narrows** the type to `string`. Left out = not touched.
5. **Gotchas:**
   - `''` is not `undefined`: `email: ''` IS filled (with nothing). That's how to test an empty field while the others are set.
   - ✘ `if (details.email)` / ✘ `if (details.acceptTerms)`: `''` and `false` are "falsy", so an empty string or `false` would be skipped. ✔ `!== undefined` skips only "left out".
   - **When not to use Partial:** if every field is always required, take `AccountDetails` itself, so a missing field is a type error.
6. **One object vs several optional parameters:** both need one `if` per field inside; the difference is at the call.
   ```ts
   // ✘ createAccount(undefined, 'fred.test.com', undefined, undefined, true)  order matters, placeholders, unreadable
   // ✔ createAccount({ email: 'fred.test.com', acceptTerms: true })            named, any left out, order free
   ```
   A new field doesn't break existing calls. `AccountDetails` is exported above the class; it moves to a shared types file when 2+ files use it.
7. **C#:** no built-in `Partial`; closest is an options class with nullable properties (`string? Email`). ⚠ Watch out: a left-out property in TS is `undefined`, not `null`; check `!== undefined`.

Docs: [Utility types: Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype), [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).

### `boolean` for a checkbox, and `setChecked`

- **`boolean`** [TS]: the type of JS `true` / `false`. A checkbox has two states; a boolean has two values. C# `bool`.
- **Data names the value, the page object names the element:**
  ```ts
  // AccountDetails (data)         CreateAccountPage (locator)
  acceptTerms: boolean;            readonly termsCheckbox: Locator;
  ```
  ✘ `termsCheckbox: string` (`'yes'` / `'no'`): any text compiles (`'Yes'`, `'y'`), and our first version ticked the box even for `'no'` because it only checked "was something given?". ✔ `acceptTerms: boolean`: `npm run typecheck` rejects `'yes'` (`Type 'string' is not assignable to type 'boolean'.`).
- **`setChecked(checked)`** [PW]: makes the box match the value: `true` → ticked, `false` → unticked. It clicks only if the state is wrong. `click()` just flips whatever it finds. `check()` / `uncheck()` = `setChecked(true)` / `setChecked(false)`.
  ```ts
  if (details.acceptTerms !== undefined) {
    await this.termsCheckbox.setChecked(details.acceptTerms); // true ticks, false unticks, left out = untouched
  }
  ```
- **In the spec, say `false`:** ✘ leaving `acceptTerms` out relies on the page starting unticked. ✔ `acceptTerms: false` states the condition the title names.
- **Selenium:** no `setChecked`; you write `if (box.Selected != wanted) box.Click();` yourself.

Docs: [setChecked](https://playwright.dev/docs/api/class-locator#locator-set-checked).

### Finding the field errors and the toast

The page after a failed submit (DevTools → Elements):

```html
<main>
  <form id="create-account-form" novalidate>
    <input type="email" id="new-email" ... />
    <span class="field-error" id="email-error" role="alert"
      >Please enter a valid email address</span
    >
    ... one span per field, empty until the app fills it
  </form>
</main>
<div id="toast-container">
  <div
    role="alert"
    data-testid="toast-notification"
    class="toast toast-success"
  >
    ✅ Account created successfully! ✕
  </div>
</div>
```

- **6 alerts:** 5 field-error spans inside `main` + the toast outside it. `page.getByRole('alert')` → `strict mode violation: getByRole('alert') resolved to 6 elements`. The accessibility tree hides empty or collapsed parts, so check the Elements tab too before assuming "only one".
- **An alert has no accessible name from its text** (DevTools → Accessibility: `Name: ""`). Like `status` (see [Accessible name](#accessible-name-where-it-comes-from)): `button`, `link`, `heading`, `checkbox` take their name from their text; `alert` and `status` don't. So ✘ `getByRole('alert', { name: 'Name must be at least 2 characters' })` → "element(s) not found".
- **Field errors:** fixed, unique text per field → ✔ `page.getByRole('main').getByText('Please enter a valid email address')`. Text in the locator, so the spec uses `toBeVisible()`.
- **Toast:** no user-facing locator is unique (6 alerts, no names), and the text must stay in the spec because `Toast` is shared. So ✔ `page.getByTestId('toast-notification')`. Rejected:
  - ✘ `.nth(5)` / `.last()`: depends on the order of elements in the HTML.
  - ✘ `.filter({ visible: true })`: works only while the field errors are empty.
  - ✘ `.filter({ hasText: 'Account created...' })` in the component: test text in a shared component; wrong on the Sign In page.
  - ✘ `page.locator('#toast-container')`: an HTML `id` is a **CSS selector**, ranked below test ids.
- **Test id vs HTML id:** `data-testid="..."` → `getByTestId()`, added for tests, survives design changes, ranked just above CSS. `id="..."` → `page.locator('#...')` = CSS, last. ⚠ Selenium: `By.Id` feels safe there; in Playwright it's just CSS.
- **Which assertion:** locator finds by text → `toBeVisible()`. Locator finds by role or test id → check the text: `toContainText('Account created successfully!')` (the toast also holds ✅ and the ✕ close button, so `toHaveText` would compare the whole text). ✘ `toContainClass` checks the `class` attribute, not the text.
- **Name it `message`, not `successMessage`:** the app calls `showToast(message, type)` about 20 times with `success`, `error` or `info` (sign-in error, dashboard guard, logout...). Same element, only the text changes; the spec decides which text is right.
- **Short-lived (~3 s):** a web-first assertion straight after the click catches it (it re-checks and passes the first time it's there). Check the toast before the URL: the redirect comes at 2 s.

Docs: [getByTestId](https://playwright.dev/docs/locators#locate-by-test-id), [toContainText](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-contain-text), [Strictness](https://playwright.dev/docs/locators#strictness).

### One invalid field per test

- Each validation test breaks **one** rule; every other field is valid. A pass or a failure then points at exactly one rule.
- ✘ Short-password test that still had `email: 'fred.test.com'` (copied from the email test): rejected for two reasons, so it can't prove the password rule alone stops it. ✔ `email: 'fred@test.com'`.
- The form has `novalidate`, so the browser's own checks (`required`, `type="email"`, `minlength="8"`) don't block the submit; only the app's messages appear. See [Native vs app validation](#native-vs-app-validation).
- Not covered on purpose: name shorter than 2 characters and "Passwords do not match" (same pattern; the name error is already checked in the empty-form test). A data-driven test covers every rule in one table in Week 6.
- **Interview line:** "Each validation test has one invalid field and everything else valid, so a failure names one rule. For many rules I'd use a data-driven test rather than copy the same test."

---

## Asking developers for accessible locators (Week 3 Day 1)

### 1. What and why

When no user-facing locator can find an element, first ask: **is something missing that a real user needs?** If yes, ask the developers for that accessibility fix. It helps screen-reader and keyboard users, and as a side effect gives you a role or label locator. Only when there is no genuine user need, use (or ask for) a test id.

- **Frame it as accessibility, not "QA needs it".** Accessibility fixes are cheap, help real users, and many companies must meet WCAG ([WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)). "Make it easier for QA" competes with features and often loses.
- **Only ask for real fixes.** The first rule of ARIA: use a native HTML element with the meaning built in before adding ARIA attributes ([Using ARIA, rule 1](https://www.w3.org/TR/using-aria/#rule1)). A wrong `role` or a made-up `aria-label` makes the page worse for screen-reader users.

### 2. Good asks, with examples

Each: HTML before (✘), after (✔), and the locator it makes possible.

**a. A clickable `div` → a real button**

```html
<div class="btn" onclick="save()">Save</div>
<!-- ✘ role generic: no keyboard, screen reader says "Save" as plain text -->
<button type="button" onclick="save()">Save</button>
<!-- ✔ role button, name "Save", works with Tab + Enter -->
```

Locator: `getByRole('button', { name: 'Save' })`.

**b. An input with no label → a linked `<label>`**

```html
<span>Email</span><input id="email" />
<!-- ✘ no accessible name -->
<label for="email">Email</label><input id="email" type="email" />
<!-- ✔ name "Email"; clicking the label focuses the field -->
```

Locator: `getByLabel('Email')`. Our create account form already does this.

**c. An icon-only button → `aria-label`**

```html
<button>✕</button>
<!-- ✘ screen reader says "button" or "multiplication x" -->
<button aria-label="Clear search">✕</button>
<!-- ✔ name "Clear search" -->
```

Locator: `getByRole('button', { name: 'Clear search' })`. Our dashboard search already does this.

**d. An image with no `alt` → `alt` text**

```html
<img src="logo.png" />
<!-- ✘ screen reader reads the file name -->
<img src="logo.png" alt="Testing Playground logo" />
<!-- ✔ -->
```

Locator: `getByAltText('Testing Playground logo')` or `getByRole('img', { name: 'Testing Playground logo' })`. Our footer logo already has it. A purely decorative image gets `alt=""` (hidden from screen readers): then it correctly has no user-facing locator.

**e. An unnamed section → a named landmark** (our toast)

```html
<div id="toast-container">
  <!-- ✘ plain div, hidden from the accessibility tree -->
  <div id="toast-container" role="region" aria-label="Notifications">
    <!-- ✔ landmark "Notifications" -->
  </div>
</div>
```

Locator: `getByRole('region', { name: 'Notifications' }).getByRole('alert')`. A `region` only counts as a landmark when it has a name ([MDN: region role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role), [APG: Landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)).

**f. Two landmarks of the same kind → give each a name**

```html
<nav>...</nav>
<nav>...</nav>
<!-- ✘ "navigation", "navigation" -->
<nav aria-label="Main navigation">
  <nav aria-label="Topics navigation"><!-- ✔ --></nav>
</nav>
```

Locator: `getByRole('navigation', { name: 'Main navigation' })`. Our header already does this.

**g. An error not linked to its field → `aria-describedby`** (our field errors)

```html
<input id="new-email" type="email" />
<span id="email-error" role="alert">...</span>
<!-- ✘ the field doesn't know its error -->
<input
  id="new-email"
  type="email"
  aria-describedby="email-error"
  aria-invalid="true"
/>
<!-- ✔ -->
```

A screen reader then reads the error when the user focuses the field. Test: `await expect(createAccountPage.emailInput).toHaveAccessibleDescription('Please enter a valid email address')` ([toHaveAccessibleDescription](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-accessible-description), [MDN: aria-describedby](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby)).

### 3. Bad asks (use a test id instead)

```html
<button aria-label="qa-submit-btn">Create Account</button>
<!-- ✘ screen reader now says "qa-submit-btn", not what's on screen -->
<div role="button">Total: 5</div>
<!-- ✘ lies: it isn't clickable -->
<tr aria-label="row-17">
  ...
</tr>
<!-- ✘ invented names only to tell repeated rows apart -->
```

✔ For these, a test id (`data-testid`) is the honest choice: invisible to users, stable, made for tests. For repeated rows, first try filtering by their content (`filter({ hasText })`, `filter({ has })`).

### 4. Which locator each element can genuinely have

| Element                      | Locators it can have                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| button, link                 | `getByRole` + name (its text, or `aria-label` if icon-only)                                        |
| text input, select, textarea | `getByLabel`, `getByRole('textbox' / 'combobox', { name })`; `getByPlaceholder` only as a fallback |
| checkbox, radio              | `getByRole('checkbox' / 'radio', { name })`, `getByLabel`                                          |
| image                        | `getByAltText`, `getByRole('img', { name })`                                                       |
| heading                      | `getByRole('heading', { name, level })`                                                            |
| landmark (nav, main, region) | `getByRole(...)`, with `{ name }` when there are several                                           |
| alert, status                | `getByRole` to scope; no name from text, so find by text (`getByText`, `filter({ hasText })`)      |
| plain text (div, span, p)    | `getByText`                                                                                        |
| element with a tooltip       | `getByTitle`                                                                                       |

Pick the highest one in [Playwright's order](https://playwright.dev/docs/locators#quick-guide) that the element genuinely has; don't ask for one it shouldn't have.

### 5. How to ask

Small, one fix per ticket, with before/after. Example:

```
Title:   Label the toast notification area for screen readers
Type:    Accessibility improvement
Where:   every page, <div id="toast-container">
Problem: Screen-reader users can't find or identify notifications: the container is an unnamed div.
Fix:     <div id="toast-container" role="region" aria-label="Notifications">
Refs:    WAI-ARIA APG "Landmark regions"; MDN "ARIA: region role"; WCAG 4.1.2
Bonus:   automated tests can find toasts by role instead of a test id.
```

- Raise it early (design review, PR review), not as a blocker on your test.
- Until it ships, use the test id and leave a one-line comment linking the ticket.
- Accept "no" when there's no user benefit; that's when the test id stays.
- In this repo we never change `webapp/`, so this stays a note (Later list).

### 6. Interview answer

"When I can't find an element the way a user would, I first check whether it's an accessibility gap, like a missing label or a div acting as a button, and ask the developers for that fix, framed as accessibility. If there's no real user need, I use a test id rather than invent an `aria-label`, because a wrong label makes the page worse for screen-reader users."

**Advanced, later:** automated accessibility scans with `@axe-core/playwright` (Week 10) find many of these gaps for you.
**C# / Selenium:** same conversation; Selenium teams usually ask for `id`s. ⚠ Watch out: in Playwright an `id` is a CSS selector; ask for the accessibility fix first, then a `data-testid`.

More: [MDN: ARIA roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles), [APG: Providing accessible names and descriptions](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/), [Using ARIA](https://www.w3.org/TR/using-aria/).

---

## Test data (Week 3 Day 2)

Our code: [walkthroughs: create account spec](walkthroughs.md#create-account-spec). Decisions and trade-offs: [decision record 003](../decisions/003-test-data.md).

### Faker

- **What:** `@faker-js/faker` [NPM] generates realistic random values: `faker.person.fullName()`, `faker.internet.email()`, `faker.internet.password({ length: 12 })`. `faker` is an object; `faker.internet` is a group of methods inside it.
- **Why:** an app that saves data rejects the same email twice ("email already taken"), so fixed data fails on the second run or in parallel. Generated data is new every run.
- **Main alternative:** hand-written values: readable, but collide once data is stored, and copied blocks drift.
- **C#:** Bogus (`new Faker().Person.FullName`).
- Docs: [fakerjs.dev](https://fakerjs.dev/api/)

### A factory with overrides

A _factory_ [OURS] is a function that returns a fresh, valid object each time. The test passes only the field it wants different.

```ts
function validAccount(overrides: Partial<AccountDetails> = {}): AccountDetails {
  const password = faker.internet.password({ length: 12 });
  return {
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    password,
    confirmPassword: password,
    acceptTerms: true,
    ...overrides,
  };
}
```

- `const password` once, so `confirmPassword` gets the **same** value (two `faker` calls would give two different passwords: "passwords don't match").
- `password,` is shorthand [JS] for `password: password`.
- `validAccount()` = all valid. `validAccount({ email: 'fred.test.com' })` = valid except the email.
- ✘ `createAccount(validAccount({}))` in the empty-form test: fills a full valid account, so no errors show. ✔ `createAccount({})`: fills nothing.
- Lives in the spec while one spec uses it; moves to `tests/test-data/` when a second spec needs it.
- **C#:** a test data builder, or a record with `with { ... }`.

### Spread `...`

1. **Kind:** spread syntax, a built-in symbol of the language (like `!==` or `=`).
2. **From:** JavaScript; it runs in the real code.
3. **Does:** unpacks an object's properties into a new object.
4. **Use:** `const x = { a: 1, b: 2, ...{ b: 9 } }` gives `{ a: 1, b: 9 }`. In our code: `...overrides` in `validAccount`.
5. **Gotchas:** the **last** property with a name wins, so `...overrides` must be last (✘ first: the random password replaces `'Pass12'` and the short-password test fails). Copies one level deep only.
6. **C#:** nearest is `record with { Password = "Pass12" }`; C# has no `...` for objects.
7. Docs: [MDN: spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)

### Default parameter `= {}`

- [JS] `overrides: Partial<AccountDetails> = {}`: if the caller passes nothing, `overrides` is `{}`. So `validAccount()` works.
- **C#:** `void M(int x = 0)`. Watch out: in JS the default can be any expression, not only a constant.
- Docs: [MDN: default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters)

### Seed: repeatable "random" values

- `faker.seed(123)` [NPM]: the number is any value you pick; the same seed gives the same values every run. C#: `new Random(123)`.
- Seeded = failures repeat, but the data never changes (no more coverage than fixed data). Not seeded (ours) = new values every run, so a value-specific bug (`Seán O'Brien`) can appear; reproduce it by copying the values from the trace into overrides.

### Native vs app validation

- **Native** [HTML]: `required`, `type="email"`, `minlength="8"`. The browser blocks the submit and shows its own bubble. The bubble isn't in the page's HTML, so no locator finds it.
- **App** [the app's JS]: a script on the form's `submit` event writes messages into `<span role="alert" class="field-error">`. Normal elements: `getByText` finds them.
- Our form has `novalidate`: the browser doesn't block, the app decides. Users see only the app's messages, so that's what we test.
- If `novalidate` were removed: the browser cancels the submit, the app's script never runs, and the empty-form test fails with "element(s) not found".
- Testing native validation (when a form uses it): `await expect(emailInput).toHaveJSProperty('validity.valid', false)`. Check `validity`, not `validationMessage` text: the text differs by browser and language. Selenium: `GetDomProperty("validationMessage")`.

### Unique data vs shared fixed users (at scale)

- Own user per test: isolated, safe in parallel; slower and leaves data to clean up (create by API, not UI).
- Shared fixed users: fast; tests interfere when one changes the user. Fine for read-only use (our `user@test.com`).

**Interview line:** "Valid data comes from a typed factory that uses Faker, and each test overrides only the field it's testing, so tests don't collide and the bad value is visible in the test. I don't seed it; when a value-specific failure happens I take the values from the trace and pin them as overrides."
