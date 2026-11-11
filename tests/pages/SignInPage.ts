// Page object for the Sign In screen (/html/signin.html).
// A page object keeps one screen's locators and actions in one place,
// so tests read like user steps and a UI change is fixed here only.
// Rule: page objects DO things; they never check things (no expect here).
// Full explanations: week-01/concepts.md (Classes, Types, Promises).

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
// We never RUN them. tsc just uses them to catch mistakes. Example of a MISTAKE:
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
  // PROPERTIES = named values stored on each copy. This class has three:
  // emailInput, passwordInput and signInButton. Each property holds a Locator.
  // A spec reads them with a dot, e.g. signInPage.signInButton
  // `readonly` = filled once in the constructor below, then never overwritten. e.g.
  //   signInPage.emailInput = page.getByLabel('Name');  -> tsc error: it's readonly
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  // WHAT IS A CONSTRUCTOR?
  // The setup code that runs once, at the moment a test writes `new SignInPage(page)`.
  // The test hands in its browser tab; here it arrives as `page`.
  //
  // `private readonly page: Page` is a shortcut. It means all of this:
  //   - accept a browser tab as input,
  //   - store it as a property called this.page, so the methods below can use it,
  //   - `private`: only code inside this class can use it. A spec can't write
  //       signInPage.page.goto('/')   -> tsc error: 'page' is private
  //     so specs go through our methods (goto, signIn) instead,
  //   - `readonly`: it can't be overwritten with another tab later.
  constructor(private readonly page: Page) {
    // Set the three properties. This only SAVES how to find each element.
    // Nothing is searched for yet: Playwright looks when fill() or click() runs.

    // The input field whose label says "Email". The HTML links them:
    //   <label for="email">Email</label>  +  <input id="email">  (for matches id)
    this.emailInput = page.getByLabel('Email');
    // Same for Password. (getByRole can't find a password field: it has no role.)
    this.passwordInput = page.getByLabel('Password');
    // The element a screen reader announces as a "button" called "Sign In".
    // getByText('Sign In') would ALSO match the <h1>Sign In</h1> heading:
    // 2 matches = strict mode error. getByRole matches only the button.
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
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
    // Without `await`, the method would finish before the page loads, and the next step
    // could run on a half-loaded page (passes sometimes, fails sometimes = flaky).
    await this.page.goto('/html/signin.html');
  }

  // Sign in like a user: type email, type password, click Sign In.
  // `(email: string, password: string)` = the method needs two pieces of text. e.g.
  //   await signInPage.signIn('user@test.com', 'Password123');   -> OK
  //   await signInPage.signIn(123, 'Password123');               -> tsc error: 123 is not text
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
