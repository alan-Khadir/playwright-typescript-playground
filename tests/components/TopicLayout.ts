// Component: the layout all 10 topic pages share (/html/dashboard.html?topic=<title>).
// Today only the loader and the title; topic page objects will hold it as `layout`
// from Week 3. Rules: docs/architecture.md, "Page objects".
import type { Locator, Page } from '@playwright/test';

export class TopicLayout {
  /** "Loading..." shown for about 1.2 s before the topic appears. A status element
   *  takes no name from its text, so we filter by text instead of { name }. */
  readonly loadingSpinner: Locator;
  /** The topic's title: the page's only h1. No name: the title differs per topic,
   *  so the spec checks which one it is. */
  readonly heading: Locator;

  /** No methods use the tab, so it isn't stored. */
  constructor(page: Page) {
    this.loadingSpinner = page
      .getByRole('status')
      .filter({ hasText: 'Loading...' });
    this.heading = page.getByRole('heading', { level: 1 });
  }
}
