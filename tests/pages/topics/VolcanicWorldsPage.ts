// Page object for the Volcanic Worlds topic (/html/dashboard.html?topic=Volcanic%20Worlds):
// its widget is a "Guess the Number" game with a range slider (1-100).
// Rules: docs/architecture.md, "Page objects".
import type { Locator, Page } from '@playwright/test';
import { TopicLayout } from '../../components/TopicLayout';

export class VolcanicWorldsPage {
  readonly layout: TopicLayout;
  readonly slider: Locator;
  /** The <output> beside the slider that shows its number (role status). */
  readonly sliderValue: Locator;

  constructor(private readonly page: Page) {
    this.layout = new TopicLayout(page);
    this.slider = this.layout.widget.getByRole('slider', {
      name: 'Volcanic Worlds value',
    });
    this.sliderValue = this.layout.widget.getByRole('status');
  }

  async goto(): Promise<void> {
    await this.page.goto(
      `/html/dashboard.html?topic=${encodeURIComponent('Volcanic Worlds')}`,
    );
  }

  /** fill() works on a range input but takes a string, hence String(value). */
  async moveSliderTo(value: number): Promise<void> {
    await this.slider.fill(String(value));
  }
}
