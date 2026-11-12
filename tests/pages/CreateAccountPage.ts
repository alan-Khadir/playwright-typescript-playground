// Page object for /html/create-account.html. Only what today's tests use (the
// heading); form fields are added when a test needs them (Week 3).
import type { Locator, Page } from '@playwright/test';

export class CreateAccountPage {
  readonly heading: Locator;

  // `page` is a plain input, NOT stored: it's only needed here, once, to build
  // the heading locator. No method uses this.page, so nothing needs storing.
  // (Same in TaskBoardPage and DashboardPage.)
  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: 'Create Account' });
  }
}
