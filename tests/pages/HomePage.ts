// Page object for the home page (/html/index.html).
// Rules: docs/architecture.md, "Page objects" and "Naming".
import type { Locator, Page } from '@playwright/test';
import { NavBar } from '../components/NavBar';

export class HomePage {
  readonly navBar: NavBar;
  readonly htmlElement: Locator;

  // The tab is stored (private readonly page) because goto() uses this.page later.
  constructor(private readonly page: Page) {
    // Composition: HomePage HAS a NavBar. Built here, so the fixture stays new HomePage(page).
    this.navBar = new NavBar(page);
    // The page root <html>. CSS locator because it has no role, label or text (our one exception).
    this.htmlElement = page.locator('html');
  }

  async goto(): Promise<void> {
    await this.page.goto('/html/index.html');
  }
}
