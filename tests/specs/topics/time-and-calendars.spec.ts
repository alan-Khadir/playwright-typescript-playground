// Tests for the Time & Calendars topic: the native transport select and the custom
// supplies multi-select (pills added and removed).
import { test, expect } from '../../fixtures';

test.describe('Time & Calendars', { tag: '@regression' }, () => {
  test('launching with a transport shows the expedition report', async ({
    timeAndCalendarsPage,
  }) => {
    await timeAndCalendarsPage.goto();

    await timeAndCalendarsPage.chooseTransport('🚀 Rocket Ship');
    await timeAndCalendarsPage.launchExpedition();

    await expect(timeAndCalendarsPage.expeditionReportHeading).toBeVisible();
  });

  test('removing a supply pill unchecks that supply', async ({
    timeAndCalendarsPage,
  }) => {
    await timeAndCalendarsPage.goto();

    await expect(timeAndCalendarsPage.supplyCounter).toHaveText(
      'Selected: 0 of 3',
    );

    await timeAndCalendarsPage.pickSupplies(['Research Books', 'Telescope']);

    await expect(timeAndCalendarsPage.supplyCounter).toHaveText(
      'Selected: 2 of 3',
    );
    await expect(timeAndCalendarsPage.supplyPills).toHaveCount(2);
    await timeAndCalendarsPage.removeSupply('Telescope');

    await expect(timeAndCalendarsPage.supplyPills).toHaveCount(1);

    await expect(timeAndCalendarsPage.supplyCounter).toHaveText(
      'Selected: 1 of 3',
    );
  });
});
