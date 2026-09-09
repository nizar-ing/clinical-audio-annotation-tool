import { test, expect } from '@playwright/test';

/**
 * Verify that the seeded dataset produces the expected work-queue rows.
 *
 * Business rules under test:
 *   - filename pairing: audio-only match creates a Recording row
 *   - duration gate:    demo-02.wav (12 s) → REJECTED_TOO_SHORT, hidden in default view
 *   - default filter:  QUEUED + IN_PROGRESS only
 *   - "Rejected" filter checkbox surfaces REJECTED_TOO_SHORT items
 */
test.describe('Work queue digest', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/queue');
    // Table must render before any assertions
    await page.locator('table').waitFor({ timeout: 10_000 });
  });

  test('shows QUEUED seeded recordings in the default view', async ({ page }) => {
    // demo-01.wav — 40 s WAV, matched transcript → QUEUED
    await expect(page.getByText('demo-01.wav')).toBeVisible();
    // demo-05.wav — 35 s WAV, matched transcript → QUEUED (brief's worked example)
    await expect(page.getByText('demo-05.wav')).toBeVisible();
  });

  test('demo-03.mp3 appears in the default queue view', async ({ page }) => {
    // 30 s MP3, matched transcript → QUEUED
    await expect(page.getByText('demo-03.mp3')).toBeVisible();
  });

  test('REJECTED recording is hidden from the default view', async ({ page }) => {
    // demo-02.wav — 12 s WAV → REJECTED_TOO_SHORT, excluded from QUEUED+IN_PROGRESS filter
    await expect(page.getByText('demo-02.wav')).not.toBeVisible();
  });

  test('UNPAIRED recording is hidden from the default view', async ({ page }) => {
    // demo-04.m4a — no matching transcript row → UNPAIRED, not in QUEUED+IN_PROGRESS
    await expect(page.getByText('demo-04.m4a')).not.toBeVisible();
  });

  test('demo-99 unmatched ImportRow does not appear in the queue', async ({ page }) => {
    // demo-99: ImportRow only (matchedRecordingId = null); no Recording row was created
    await expect(page.getByText('demo-99.wav')).not.toBeVisible();
  });

  test('enabling the Rejected filter surfaces REJECTED_TOO_SHORT items', async ({ page }) => {
    // hasText with a plain string does a normalised substring match; the regex
    // /^Rejected$/ would fail because the label element contains a child <input>
    // whose text Playwright includes in the full text content.
    const rejectedLabel = page
      .locator('label')
      .filter({ hasText: 'Rejected' });
    const checkbox = rejectedLabel.locator('input[type="checkbox"]');

    await checkbox.check();

    // demo-02.wav should now appear under the Rejected filter
    await expect(page.getByText('demo-02.wav')).toBeVisible({ timeout: 5_000 });
  });

  test('duration column shows MM:SS formatted values', async ({ page }) => {
    // Grab the duration cell (second td) of the first visible row
    const firstRow = page.locator('tbody tr').first();
    const durationCell = firstRow.locator('td').nth(1);
    await expect(durationCell).toHaveText(/^\d{2}:\d{2}$/);
  });

  test('status badge for a QUEUED recording contains the Queued label', async ({ page }) => {
    const demo01Row = page.locator('tbody tr').filter({ hasText: 'demo-01.wav' });
    const badge = demo01Row.locator('td').nth(2); // Status is the 3rd column
    await expect(badge).toHaveText(/Queued|In Progress/i);
  });

  test('clicking a table row navigates to the annotation workspace', async ({ page }) => {
    await page.locator('tbody tr').first().click();
    await expect(page).toHaveURL(/\/annotate\/.+/);
  });
});
