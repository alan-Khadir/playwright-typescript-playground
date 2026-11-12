// Page object for the Sign In screen (/html/signin.html).
// A page object keeps one screen's locators and actions in one place, so:
//   - tests read like user steps: await signInPage.signIn('user@test.com', 'Password123');
//   - when the screen changes, you fix ONE line here, not every test. Example: if the
//     developers rename the button from "Sign In" to "Log in", only this line changes:
//       this.signInButton = page.getByRole('button', { name: 'Log in' });
//     Every test that calls signIn() keeps working without being touched.
// Rule: page objects DO things; they never check things (no expect here).
// Docs: https://playwright.dev/docs/pom
//       https://www.typescriptlang.org/docs/handbook/2/classes.html

// WHAT IS A TYPE?
// A type is a label that says what kind of value something must hold.
// Like a "Date" column in a test-case spreadsheet: it only accepts dates,
// and you'd notice if someone typed "banana" into it.
//   Page    = the label for "a browser tab"
//   Locator = the label for "a way to find an element"
//
// WHY `import type` AND NOT `import`?
// In this file, Page and Locator only ever appear AFTER A COLON, as labels:
//   readonly emailInput: Locator;   -> "the emailInput property must hold a Locator"
//   constructor(... page: Page)     -> "this input must be a browser tab"
// The WORDS Page and Locator are only labels: when the test runs, TypeScript deletes
// them first, so they never run. (The real page and locators they describe DO run:
// this.page.goto(...), this.emailInput.fill(...).) Before that, `npm run typecheck`
// and VS Code (red underline) read the labels to catch mistakes. Example of a MISTAKE:
//   this.emailInput = 'hello';
// emailInput is labelled Locator, but 'hello' is text (a string), not a Locator.
// `npm run typecheck` stops it with:
//   Type 'string' is not assignable to type 'Locator'.
// Labels only -> `import type`.
//
// Compare sign-in.spec.ts: there we RUN test(...) and expect(...) (they do things),
// so they come in with a normal `import`.
import type { Locator, Page } from '@playwright/test';

// WHAT IS A CLASS?
// A class is a blueprint, like a test-case TEMPLATE. Each test fills in its own copy:
//   const signInPage = new SignInPage(page);   -> `new` builds one copy (an "object")
// Two tests = two separate copies, so they never share anything.
// `export` = other files may use this class. Without it, the spec's
//   import { SignInPage } from '../../pages/SignInPage';  -> error: not exported
export class SignInPage {
  // PROPERTIES = named values stored on each copy. This class has five:
  // emailInput, passwordInput, signInButton, errorMessage and heading. Each property holds a Locator.
  // A spec reads them with a dot, e.g. signInPage.signInButton
  // `readonly` = filled once in the constructor below, then never overwritten. e.g.
  //   signInPage.emailInput = page.getByLabel('Name');
  //   -> `npm run typecheck` reports: Cannot assign to 'emailInput' because it is a read-only property.
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  // The error text shown under the form after a wrong email or password.
  // WHY A PROPERTY, NOT A METHOD THAT RETURNS THE TEXT:
  //   ✘ async getErrorText() { return await this.errorMessage.textContent(); }
  //     spec: expect(await signInPage.getErrorText()).toBe('Invalid email or password.');
  //     textContent() reads the text ONCE. If the app hasn't shown the error yet,
  //     it reads '' and toBe fails straight away: no retry = flaky.
  //   ✔ readonly errorMessage: Locator;
  //     spec: await expect(signInPage.errorMessage).toBeVisible();
  //     expect() gets the Locator, so toBeVisible() re-checks for up to 5 seconds.
  // The spec does the check (every expect lives in the spec); this file only says
  // how to FIND the element. Same pattern as Playwright's own example:
  // https://playwright.dev/docs/pom  (readonly tocList: Locator)
  // Full comparison of the 4 options: docs/architecture.md, "Page objects".
  readonly errorMessage: Locator;
  readonly heading: Locator;

  // WHAT IS A CONSTRUCTOR?
  // The setup code that runs once, at the moment a test writes `new SignInPage(page)`.
  // The test hands in its browser tab; here it arrives as `page`.
  //
  // `private readonly page: Page` is a shortcut. It means all of this:
  //   - accept a browser tab as input,
  //   - store it as a property called this.page, so the methods below can use it,
  //   - `private`: only code inside this class can use it. A spec can't write
  //       signInPage.page.goto('/')
  //       -> `npm run typecheck` reports: Property 'page' is private and only accessible within class 'SignInPage'.
  //     so specs go through our methods (goto, signIn) instead,
  //   - `readonly`: it can't be overwritten with another tab later.
  constructor(private readonly page: Page) {
    // Set the five properties. This only SAVES how to find each element.
    // Nothing is searched for yet: Playwright looks when fill() or click() runs.

    // The input field whose label says "Email". The HTML links them:
    //   <label for="email">Email</label>  +  <input id="email">  (for matches id)
    this.emailInput = page.getByLabel('Email');
    // Same for Password. getByRole('textbox', { name: 'Password' }) would also work
    // (Playwright treats a password input as a textbox, though the W3C table
    // https://www.w3.org/TR/html-aria/ says "no role"), but getByLabel is the
    // recommended locator for form fields, and it matches the Email line above.
    this.passwordInput = page.getByLabel('Password');
    // The element a screen reader announces as a "button" called "Sign In".
    // getByText('Sign In') would ALSO match the <h1>Sign In</h1> heading:
    // 2 matches = strict mode error. getByRole matches only the button.
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    // The error is a <div> with no role (a div's role is "generic"; aria-live="polite"
    // only tells screen readers to read new text, it adds no role). It's not a form
    // field either, so getByRole and getByLabel can't find it. Next in the list:
    // getByText, for plain text in div/span/p.
    // https://playwright.dev/docs/locators#locate-by-text
    // Which tag gets which role: https://www.w3.org/TR/html-aria/
    // (check in Chrome DevTools > Elements > Accessibility tab)
    //
    // STRICT MODE: the app shows this text TWICE: under the form AND in a pop-up
    // (a "toast", role alert) in the corner. page.getByText(...) alone matches both:
    //   ✘ page.getByText('Invalid email or password.')
    //     -> Error: strict mode violation: ... resolved to 2 elements
    // A locator used to act or check must match exactly ONE element.
    //   ✘ .first() would also pass, but picks whichever comes first today; if the
    //     page changes it silently checks the toast instead.
    //   ✔ Scope it: page.getByRole('main') = the <main> area (role main). Calling
    //     .getByText() ON it searches only inside main. The form message is inside
    //     main; the toast is added outside it, at the end of the page. 1 match.
    // https://playwright.dev/docs/locators#strictness
    // https://playwright.dev/docs/locators#matching-inside-a-locator
    this.errorMessage = page
      .getByRole('main')
      .getByText('Invalid email or password.');

    this.heading = page.getByRole('heading', { name: 'Sign In' });
  }

  // WHAT IS A METHOD?
  // A function that belongs to the class: a named set of steps. A test runs it with a dot:
  //   await signInPage.goto();
  //
  // PROMISE: not a method. It's an object built into JavaScript that stands for
  // "work that has started but may not have finished yet". page.goto() starts loading
  // the page and IMMEDIATELY returns a Promise. Later that Promise either:
  //   - finishes successfully (the page loaded), or
  //   - fails with an error (e.g. the server is down).
  //
  // `await` = pause this code until that Promise finishes. If it failed, the test fails here.
  //
  // `async` = a keyword on a method that does two things:
  //   1. allows `await` inside it. Without `async`, using `await` is an error:
  //        'await' expressions are only allowed within async functions
  //   2. makes the method itself return a Promise, so the TEST must await it too:
  //        await signInPage.goto();
  //
  // `Promise<void>` = the return type: "returns a Promise that, when finished, carries
  // no value". `void` = nothing to give back. goto() just opens the page.
  // Compare: page.title() returns Promise<string>: when finished it carries text,
  //   const title = await page.title();   -> title = 'Sign In — Testing Playground'
  async goto(): Promise<void> {
    // Open the sign-in page. '/html/signin.html' is added to baseURL from
    // playwright.config.ts, so the browser opens http://localhost:3000/html/signin.html
    // What `await` waits for here: page.goto() finishes when the browser fires its
    // "load" event (the HTML, scripts and images have loaded). That's Playwright's
    // default, waitUntil: 'load'. Docs: https://playwright.dev/docs/api/class-page#page-goto
    // It does NOT check that every element is ready (content the page's JavaScript adds
    // later). That's covered by fill()/click() auto-waiting and by expect() in the spec.
    // Without `await`, goto() would return straight away while the page is still
    // loading, and the next step (fill) would race the page load = flaky.
    await this.page.goto('/html/signin.html');
  }

  // Sign in like a user: type email, type password, click Sign In.
  // `(email: string, password: string)` = the method needs two pieces of text (strings).
  // In code, text goes in quotes: 'user@test.com'. A number has no quotes: 123.
  //   await signInPage.signIn('user@test.com', 'Password123');   -> OK: two strings
  // Example of a MISTAKE a test could make, passing a number as the email:
  //   await signInPage.signIn(123, 'Password123');
  // `npm run typecheck` stops it before the test runs:
  //   Argument of type 'number' is not assignable to parameter of type 'string'.
  // The values come in from the test (not written in here), so the wrong-password
  // test can reuse this method: signIn('user@test.com', 'WrongPassword')
  async signIn(email: string, password: string): Promise<void> {
    // fill(): clears the input field, then types the text into it.
    // It first waits (automatically) until the field is visible and can be typed in.
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    // click(): presses the button. It first waits until the button is visible,
    // not moving, enabled and not covered by anything else.
    await this.signInButton.click();
  }
}
