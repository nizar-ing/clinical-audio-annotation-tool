import { test, expect } from '@playwright/test';
import { getAnnotatableId } from './helpers.js';

/**
 * Verify the audio player renders correctly and its controls are interactive.
 *
 * Headless Chromium blocks autoplay and has no audio hardware, so these tests
 * verify DOM presence and UI state changes rather than actual sound output.
 * The play() call sets playing=true optimistically (see useAudioPlayer.ts:54),
 * so the Pause icon appears even when the media element cannot actually play.
 */
test.describe('Audio player controls', () => {
  test.beforeEach(async ({ page }) => {
    const id = await getAnnotatableId(page);
    await page.goto(`/annotate/${id}`);
    // <audio> is non-visual (no rendered box) — wait for DOM attachment, not visibility.
    // WorkspacePage renders it after GET /api/v1/recordings/:id resolves.
    await page.locator('audio').waitFor({ state: 'attached', timeout: 15_000 });
  });

  test('audio element is present with an /uploads src', async ({ page }) => {
    const src = await page.locator('audio').getAttribute('src');
    expect(src).toMatch(/\/uploads\//);
  });

  test('play button is visible and labelled correctly', async ({ page }) => {
    await expect(page.locator('button[title="Play (Space)"]')).toBeVisible();
  });

  test('clicking play toggles to the Pause state', async ({ page }) => {
    await page.locator('button[title="Play (Space)"]').click();
    // playing=true is set synchronously in useAudioPlayer.play(); Vue then
    // updates the button title to "Pause (Space)" on the next tick.
    await expect(page.locator('button[title="Pause (Space)"]')).toBeVisible({
      timeout: 3_000,
    });
  });

  test('clicking pause from Play state returns to Play', async ({ page }) => {
    await page.locator('button[title="Play (Space)"]').click();
    await page.locator('button[title="Pause (Space)"]').waitFor({ timeout: 3_000 });

    await page.locator('button[title="Pause (Space)"]').click();
    await expect(page.locator('button[title="Play (Space)"]')).toBeVisible({
      timeout: 3_000,
    });
  });

  test('skip-back 5 s button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Skip back 5 s (←)"]')).toBeVisible();
  });

  test('skip-forward 5 s button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Skip forward 5 s (→)"]')).toBeVisible();
  });

  test('speed selector shows the standard speed steps', async ({ page }) => {
    const select = page.locator('select[title="Playback speed (, / .)"]');
    await expect(select).toBeVisible();
    // Spot-check a few of the seven speed options (0.5× to 2.0×)
    await expect(select.locator('option[value="0.5"]')).toHaveText('0.5×');
    await expect(select.locator('option[value="1"]')).toHaveText('1×');
    await expect(select.locator('option[value="2"]')).toHaveText('2×');
  });

  test('changing the speed selector value persists the selection', async ({ page }) => {
    const select = page.locator('select[title="Playback speed (, / .)"]');
    await select.selectOption('1.25');
    await expect(select).toHaveValue('1.25');
  });

  test('seek range input is present and interactive', async ({ page }) => {
    const seekBar = page.locator('input[type="range"]');
    await expect(seekBar).toBeVisible();
    // Verify the range is configured correctly (min=0, max=1000)
    await expect(seekBar).toHaveAttribute('min', '0');
    await expect(seekBar).toHaveAttribute('max', '1000');
  });
});
