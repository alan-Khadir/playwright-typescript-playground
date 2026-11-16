// Component: the Main navigation (on every page). Page objects include it as
// a property (composition): homePage.navBar.openSignIn().
// Rules: docs/architecture.md, "Page objects" and "Naming".
import type { Locator, Page } from '@playwright/test';

export class NavBar {
  // `private`: the spec never needs the nav itself, only the links and button inside it.
  private readonly mainNavigation: Locator;
  readonly loginLink: Locator;
  readonly signUpLink: Locator;
  readonly taskBoardLink: Locator;
  readonly darkModeButton: Locator;

  // `page` is a plain input, not stored: no method here uses this.page.
  constructor(page: Page) {
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
    // Name comes from aria-label="Toggle dark mode"; the 🌙 inside the button is ignored.
    this.darkModeButton = this.mainNavigation.getByRole('button', {
      name: 'Toggle dark mode',
    });
  }

  // open<Destination>(): reach another page through the UI, like a user.
  // Named after the page object it leads to (openSignIn -> SignInPage), not the
  // link text ("Login").
  async openSignIn(): Promise<void> {
    await this.loginLink.click();
  }

  async openCreateAccount(): Promise<void> {
    await this.signUpLink.click();
  }

  async openTaskBoard(): Promise<void> {
    await this.taskBoardLink.click();
  }

  async toggleDarkMode(): Promise<void> {
    await this.darkModeButton.click();
  }
}
