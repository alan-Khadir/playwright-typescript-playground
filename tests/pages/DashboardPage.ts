// Page object for the dashboard (/html/dashboard.html): the topic grid a signed-in
// user sees, with search and a clear button. Signed out, the app sends the user to
// /html/signin.html?redirect=dashboard.
// Rules: docs/architecture.md, "Page objects" and "Naming".
import type { Locator, Page } from '@playwright/test';

export class DashboardPage {
  readonly heading: Locator;
  /** The topic cards (4 per page). Each card is a link; inside <main> they are the
   *  only links (header and breadcrumb links sit outside it). */
  readonly topicCards: Locator;
  /** The search box. Its name comes from aria-label="Search topics" (no <label>). */
  readonly searchTopicsInput: Locator;
  /** The ✕ button (aria-label "Clear search"). Hidden until text is typed, so
   *  getByRole finds it only after a search. */
  readonly clearSearchButton: Locator;
  /** The title (h3) inside each card: lets a spec check exact titles, not the whole card's text. */
  readonly topicTitles: Locator;

  /** Stores the tab (private readonly page) because goto() uses it later. */
  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Choose a Topic' });
    this.topicCards = page.getByRole('main').getByRole('link');
    this.searchTopicsInput = page.getByRole('searchbox', {
      name: 'Search topics',
    });
    this.clearSearchButton = page.getByRole('button', { name: 'Clear search' });
    this.topicTitles = this.topicCards.getByRole('heading');
  }

  /** Opens the dashboard directly, as a user typing or bookmarking the URL. */
  async goto(): Promise<void> {
    await this.page.goto('/html/dashboard.html');
  }

  /** Types a search term; fill() fires the input event the app filters on. */
  async searchTopics(term: string): Promise<void> {
    await this.searchTopicsInput.fill(term);
  }

  /** Clears the search with the ✕ button, as a user would. */
  async clearSearch(): Promise<void> {
    await this.clearSearchButton.click();
  }

  /** Opens a topic from the grid. Picks the card that contains a heading with that
   *  title: the header's "Topics navigation" has a link with the same name. */
  async openTopic(title: string): Promise<void> {
    await this.topicCards
      .filter({ has: this.page.getByRole('heading', { name: title }) })
      .click();
  }
}
