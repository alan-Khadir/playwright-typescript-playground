// Tests for the Volcanic Worlds topic: the range slider. The game's target number is
// random, so Hot/Warm/Cold results are not asserted.
import { test, expect } from '../../fixtures';

test.describe('Volcanic Worlds', { tag: '@regression' }, () => {
  test('moving the slider shows the chosen number', async ({
    volcanicWorldsPage,
  }) => {
    await volcanicWorldsPage.goto();

    await volcanicWorldsPage.moveSliderTo(25);

    await expect(volcanicWorldsPage.sliderValue).toHaveText('25');
  });
});
