// Page object for the Time & Calendars topic (/html/dashboard.html?topic=Time%20%26%20Calendars):
// its widget is "Build Your Expedition": a native <select> for transport and a custom
// multi-select for supplies (checkboxes that add removable pills, max 3).
// Rules: docs/architecture.md, "Page objects". Walkthrough: docs/learning/walkthroughs.md#timeandcalendarspage
import type { Locator, Page } from '@playwright/test';
import { TopicLayout } from '../../components/TopicLayout';

export class TimeAndCalendarsPage {
  readonly layout: TopicLayout;
  /** Native <select>: its role is combobox, its name comes from the label. */
  readonly transportSelect: Locator;
  readonly launchExpeditionButton: Locator;
  readonly expeditionReportHeading: Locator;
  /** "Selected: N of 3". Found by its fixed start; the spec checks the full text. */
  readonly supplyCounter: Locator;
  /** One pill per picked supply. A pill is a <span> with no role, so we take the spans
   *  (CSS tag) that contain a "Remove ..." button. */
  readonly supplyPills: Locator;

  constructor(private readonly page: Page) {
    this.layout = new TopicLayout(page);
    this.transportSelect = this.layout.widget.getByRole('combobox', {
      name: 'Choose your transport',
    });
    this.launchExpeditionButton = this.layout.widget.getByRole('button', {
      name: 'Launch Expedition',
    });
    this.expeditionReportHeading = this.layout.widget.getByRole('heading', {
      name: 'Expedition Report',
    });
    this.supplyCounter = this.layout.widget.getByText('Selected:');
    this.supplyPills = this.layout.widget
      .locator('span')
      .filter({ has: page.getByRole('button', { name: /^Remove / }) });
  }

  async goto(): Promise<void> {
    await this.page.goto(
      `/html/dashboard.html?topic=${encodeURIComponent('Time & Calendars')}`,
    );
  }

  /** { label } = the exact visible label, emoji included (e.g. '🚀 Rocket Ship'). */
  async chooseTransport(transport: string): Promise<void> {
    await this.transportSelect.selectOption({ label: transport });
  }

  async launchExpedition(): Promise<void> {
    await this.launchExpeditionButton.click();
  }

  /** Which checkbox depends on the test's value, so the locator is built here, not in
   *  the constructor. for...of awaits each tick; forEach would not wait. */
  async pickSupplies(supplies: string[]): Promise<void> {
    for (const supply of supplies) {
      await this.layout.widget.getByRole('checkbox', { name: supply }).check();
    }
  }

  /** Clicks the ✕ inside the pill that contains this supply, so tests pass plain names. */
  async removeSupply(supply: string): Promise<void> {
    await this.supplyPills
      .filter({ hasText: supply })
      .getByRole('button')
      .click();
  }
}
