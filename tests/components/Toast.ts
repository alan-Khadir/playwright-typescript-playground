// Component: the toast, the short-lived pop-up message (~3 s) in #toast-container, outside
// <main>. Shown on many screens (create account, sign in, dashboard guard...).
// Rules: docs/architecture.md, "Locators". Walkthrough: docs/learning/walkthroughs.md#toast
import type { Locator, Page } from '@playwright/test';

export class Toast {
  /** Any toast's text (success, error or info); the spec checks which. Test id because
   *  getByRole('alert') also matches the form's field errors, and alerts have no name. */
  readonly message: Locator;

  /** No method uses the tab, so it isn't stored. */
  constructor(page: Page) {
    this.message = page.getByTestId('toast-notification');
  }
}
