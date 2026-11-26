// Component: the layout all 10 topic pages share (/html/dashboard.html?topic=<title>):
// the loader, the title and the widget. Topic page objects (tests/pages/topics/) hold it
// as `layout` and find their own parts inside `layout.widget`.
// Rules: docs/architecture.md, "Page objects". Walkthrough: docs/learning/walkthroughs.md#topiclayout
import type { Locator, Page } from '@playwright/test';

export class TopicLayout {
  /** "Loading..." shown for about 1.2 s before the topic appears. A status element
   *  takes no name from its text, so we filter by text instead of { name }. */
  readonly loadingSpinner: Locator;
  /** The topic's title: the page's only h1. No name: the title differs per topic,
   *  so the spec checks which one it is. */
  readonly heading: Locator;
  /** The topic's interactive area (form, slider, dropdowns...): a <section> with
   *  aria-label "<title> interactive component", so role region. The title differs per
   *  topic, so a RegExp (no quotes) matches the shared words on all 10 topics. */
  readonly widget: Locator;

  /** No methods use the tab, so it isn't stored. */
  constructor(page: Page) {
    this.loadingSpinner = page
      .getByRole('status')
      .filter({ hasText: 'Loading...' });
    this.heading = page.getByRole('heading', { level: 1 });
    this.widget = page.getByRole('region', { name: /interactive component/ });
  }
}
