import type { Page } from '@playwright/test';

/**
 * Return the ID of the first annotatable (QUEUED or IN_PROGRESS) recording.
 * Tests change status from QUEUED → IN_PROGRESS on first navigation, so we
 * query both to avoid 0-result responses in later tests.
 */
export async function getAnnotatableId(page: Page): Promise<string> {
  const res = await page.request.get(
    '/api/v1/queue?status=QUEUED,IN_PROGRESS&sort=createdAt&limit=1',
  );
  const body = (await res.json()) as { data: Array<{ id: string }> };
  const id = body.data[0]?.id;
  if (!id) {
    throw new Error(
      'No QUEUED or IN_PROGRESS items found — run `yarn bootstrap` to seed the database.',
    );
  }
  return id;
}

/**
 * Seeded transcripts have alignmentMethod:"none" and wordTimings:null because
 * the seed bypasses the CreateTranscriptHandler. Patching correctedText through
 * the API triggers the UpdateCorrectedTranscriptHandler, which re-runs word
 * alignment and persists the resulting WordTiming[] array.
 *
 * Always patches unconditionally (even if wordTimings is already set) so that
 * the alignment is fresh and verified before each word-seek test run.
 *
 * Throws if the server returns a non-ok response or produces empty timings,
 * so failures surface here with a clear message rather than timing out in the
 * test body after waiting 15 s for spans that will never appear.
 */
export async function ensureWordTimings(page: Page, recordingId: string): Promise<void> {
  const txRes = await page.request.get(`/api/v1/recordings/${recordingId}/transcript`);
  if (!txRes.ok()) {
    throw new Error(`GET transcript failed: HTTP ${txRes.status()}`);
  }
  const { data: tx } = (await txRes.json()) as { data: { correctedText: string } };

  const patchRes = await page.request.patch(
    `/api/v1/recordings/${recordingId}/transcript/corrected`,
    {
      data: { correctedText: tx.correctedText },
      headers: { 'Content-Type': 'application/json' },
    },
  );
  if (!patchRes.ok()) {
    const body = await patchRes.text();
    throw new Error(`PATCH transcript/corrected failed: HTTP ${patchRes.status()} — ${body}`);
  }
  const patchBody = (await patchRes.json()) as {
    data: { wordTimings: Array<unknown> | null };
  };
  if (!patchBody.data.wordTimings || patchBody.data.wordTimings.length === 0) {
    throw new Error(
      `Word alignment produced no timings for recording ${recordingId}. ` +
        'Check that the audio file exists in uploads/ and that the API can decode it.',
    );
  }
}
