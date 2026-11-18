// Page object for the dashboard (/html/dashboard.html): the topic grid a signed-in
// user sees. Signed out, the app sends the user to /html/signin.html?redirect=dashboard.
// Rules: docs/architecture.md, "Page objects" and "Naming".
import type { Locator, Page } from '@playwright/test';

export class DashboardPage {
  readonly heading: Locator;
  /** The topic cards (4 per page). Each card is a link; inside <main> they are the
   *  only links (header and breadcrumb links sit outside it). */
  readonly topicCards: Locator;

  /** Stores the tab (private readonly page) because goto() uses it later. */
  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Choose a Topic' });
    this.topicCards = page.getByRole('main').getByRole('link');
  }

  /** Opens the dashboard directly, as a user typing or bookmarking the URL. */
  async goto(): Promise<void> {
    await this.page.goto('/html/dashboard.html');
  }
}
