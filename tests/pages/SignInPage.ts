// Page object for the Sign In screen (/html/signin.html): its locators and the
// actions a user takes there. No expect here: specs do the checking.
// Line-by-line walkthrough: docs/learning/walkthroughs.md#signinpage
// Docs: https://playwright.dev/docs/pom
import type { Locator, Page } from '@playwright/test';

export class SignInPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  /** The error under the form after a wrong email or password. A property, not a
   *  method returning its text, so specs can use a retrying expect on it. */
  readonly errorMessage: Locator;
  readonly heading: Locator;

  /** Stores the tab (private readonly page) because goto() uses it later. */
  constructor(private readonly page: Page) {
    // Form fields by their label (recommended for form controls).
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    // getByRole, not getByText: the <h1> also says "Sign In" (2 matches = strict mode error).
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    // The same text also appears in a toast outside <main>; scoping to main gives
    // exactly one match (not .first()). https://playwright.dev/docs/locators#strictness
    this.errorMessage = page
      .getByRole('main')
      .getByText('Invalid email or password.');
    this.heading = page.getByRole('heading', { name: 'Sign In' });
  }

  /** Opens the sign-in page directly (path is joined to baseURL). */
  async goto(): Promise<void> {
    await this.page.goto('/html/signin.html');
  }

  /** Signs in like a user: fill email and password, click Sign In. */
  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
