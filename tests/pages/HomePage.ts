// Page object for the home page (/html/index.html).
// Rules: docs/architecture.md, "Page objects" and "Naming".
import type { Locator, Page } from '@playwright/test';

export class HomePage {
  // `private`: the spec never needs the nav itself, only the links inside it.
  private readonly mainNavigation: Locator;
  readonly loginLink: Locator;
  readonly signUpLink: Locator;
  readonly taskBoardLink: Locator;

  // The tab is stored (private readonly page) because goto() uses this.page later.
  constructor(private readonly page: Page) {
    // The header has two navigation landmarks, so pick ours by its aria-label name.
    this.mainNavigation = page.getByRole('navigation', {
      name: 'Main navigation',
    });
    // CHAINING: calling getByRole ON this.mainNavigation searches only inside that
    // nav, not the whole page. `name` matches part of the text, so an unscoped
    // getByRole('link', { name: 'Login' }) could also match any other link containing
    // "Login" = strict mode error. https://playwright.dev/docs/locators#matching-inside-a-locator
    this.loginLink = this.mainNavigation.getByRole('link', { name: 'Login' });
    this.signUpLink = this.mainNavigation.getByRole('link', {
      name: 'Sign-up',
    });
    this.taskBoardLink = this.mainNavigation.getByRole('link', {
      name: 'Task Board',
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/html/index.html');
  }

  // open<Destination>(): reach another page through the UI, like a user.
  // Named after the page object it leads to (openSignIn -> SignInPage), not the
  // link text ("Login"). goto() = open THIS page directly by its URL.
  async openSignIn(): Promise<void> {
    await this.loginLink.click();
  }

  async openCreateAccount(): Promise<void> {
    await this.signUpLink.click();
  }

  async openTaskBoard(): Promise<void> {
    await this.taskBoardLink.click();
  }
}
