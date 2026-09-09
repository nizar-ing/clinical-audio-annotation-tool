import { test, expect } from '@playwright/test';
import { getAnnotatableId, ensureWordTimings } from './helpers.js';

/**
 * Verify word-click-to-seek: clicking a word in the original transcript pane
 * sets the audio player's currentTime to that word's estimated timestamp.
 *
 * Background:
 *   Seeded transcripts have alignmentMethod:"none" and wordTimings:null because
 *   the seed script bypasses the CreateTranscriptHandler. ensureWordTimings()
 *   patches the corrected text through the API, triggering WordAlignmentDomainService
 *   to populate wordTimings before the page loads.
 *
 *   useAudioPlayer.seek(t) clamps to [0, duration]. duration is only > 0 after
 *   the <audio> element fires loadedmetadata. The /uploads proxy (added to
 *   vite.config.ts) forwards audio requests to the API so the real WAV/MP3 files
 *   load and provide a valid duration in the test browser.
 */
test.describe('Word-click seeks the audio player', () => {
  let recordingId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    recordingId = await getAnnotatableId(page);
    await ensureWordTimings(page, recordingId);
    await page.close();
  });

  test('clicking a word in the original pane seeks the audio to the word timestamp', async ({
    page,
  }) => {
    await page.goto(`/annotate/${recordingId}`);

    // Wait until the original transcript renders word spans. These only appear
    // when wordTimings is a non-empty array (ensured by beforeAll above).
    const wordSpans = page.locator('span[title^="Seek to"]');
    await wordSpans.first().waitFor({ timeout: 15_000 });

    // Use the second span (index 1) to avoid t=0 ambiguity on the first token.
    const targetSpan = wordSpans.nth(1);
    const titleAttr = await targetSpan.getAttribute('title');
    expect(titleAttr).toMatch(/^Seek to \d+\.\d+s$/);

    // Parse the expected seek time from the title attribute.
    const expectedTime = parseFloat((titleAttr ?? '').replace('Seek to ', '').replace('s', ''));
    expect(expectedTime).toBeGreaterThan(0);

    // Wait for the audio element to have loaded metadata so that
    // useAudioPlayer.duration.value > 0 and seek() is not clamped to 0.
    await page.waitForFunction(
      () => {
        const audio = document.querySelector('audio') as HTMLAudioElement | null;
        return audio !== null && audio.duration > 0;
      },
      { timeout: 15_000 },
    );

    // Click the word — this emits 'word-click' → WorkspacePage.seekAudio() →
    // AudioPlayer.seek() → useAudioPlayer.seek() → audioEl.currentTime = t
    await targetSpan.click();

    // Read the audio element's currentTime directly from the DOM.
    const actualTime = await page.evaluate<number>(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio.currentTime;
    });

    // Allow a 0.5 s tolerance: proportional alignment is an estimate and the
    // browser may apply a small offset when setting currentTime on a real file.
    expect(Math.abs(actualTime - expectedTime)).toBeLessThan(0.5);
  });
});
