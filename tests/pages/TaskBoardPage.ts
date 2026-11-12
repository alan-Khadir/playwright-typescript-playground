import type { Locator, Page } from '@playwright/test';

export class TaskBoardPage {
  readonly heading: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: 'Learning Task Board' });
  }
}
