import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../../../../shared/infrastructure/database/postgres/prisma.client.js';
import { PrismaTranscriptRepository } from '../../../infrastructure/prisma-transcript.repository.js';
import { PrismaRecordingReadAdapter } from '../../../infrastructure/prisma-recording-read.adapter.js';
import { PrismaAnnotationAnchoringAdapter } from '../../../infrastructure/prisma-annotation-anchoring.adapter.js';
import { CreateTranscriptHandler } from '../create-transcript/create-transcript.handler.js';
import { UpdateCorrectedTranscriptHandler } from '../update-corrected-transcript/update-corrected-transcript.handler.js';
import type { AudioEnergyPort, SpeechRegion } from '../../ports/audio-energy.port.js';

const RECORDING_ID = 'test-update-corrected-recording-1';

class EmptyEnergyPort implements AudioEnergyPort {
  async getSpeechRegions(): Promise<SpeechRegion[]> {
    return [];
  }
}

async function seedRecording() {
  await prisma.annotationSpan.deleteMany({ where: { transcript: { recordingId: RECORDING_ID } } });
  await prisma.transcript.deleteMany({ where: { recordingId: RECORDING_ID } });
  await prisma.recording.deleteMany({ where: { id: RECORDING_ID } });
  await prisma.recording.create({
    data: {
      id: RECORDING_ID,
      originalFilename: 'uc.wav',
      storageKey: 'uc.wav',
      mimeType: 'audio/wav',
      sizeBytes: 1000,
      durationSeconds: 30,
      sampleRate: 16000,
      channels: 1,
      status: 'QUEUED',
    },
  });
}

describe('UpdateCorrectedTranscriptHandler (integration)', () => {
  const transcripts = new PrismaTranscriptRepository(prisma);
  const recordings = new PrismaRecordingReadAdapter(prisma);
  const annotations = new PrismaAnnotationAnchoringAdapter(prisma);
  const energy = new EmptyEnergyPort();
  const createHandler = new CreateTranscriptHandler(transcripts, recordings, energy);
  const updateHandler = new UpdateCorrectedTranscriptHandler(transcripts, recordings, energy, annotations);

  beforeAll(async () => {
    await seedRecording();
  });

  afterAll(async () => {
    await prisma.annotationSpan.deleteMany({ where: { transcript: { recordingId: RECORDING_ID } } });
    await prisma.transcript.deleteMany({ where: { recordingId: RECORDING_ID } });
    await prisma.recording.deleteMany({ where: { id: RECORDING_ID } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.annotationSpan.deleteMany({ where: { transcript: { recordingId: RECORDING_ID } } });
    await prisma.transcript.deleteMany({ where: { recordingId: RECORDING_ID } });
    await createHandler.execute({ recordingId: RECORDING_ID, originalText: 'Cefuroxim 1500 mg intravenoes' });
  });

  it('re-anchors a span when the anchor shifts by an inserted prefix', async () => {
    const transcript = await transcripts.findByRecordingId(RECORDING_ID);
    await prisma.annotationSpan.create({
      data: {
        id: 'span-uc-1',
        transcriptId: transcript!.id,
        spanType: 'MEDICAL_TERM',
        startOffset: 0,
        endOffset: 9,
        anchorText: 'Cefuroxim',
        attributes: { spanType: 'MEDICAL_TERM', category: 'drug' },
        needsReview: false,
      },
    });

    const result = await updateHandler.execute({
      recordingId: RECORDING_ID,
      correctedText: 'OP: Cefuroxim 1500 mg intravenoes',
    });

    expect(result.reanchor.updated).toBe(1);
    expect(result.reanchor.flagged).toBe(0);
    const stored = await prisma.annotationSpan.findUnique({ where: { id: 'span-uc-1' } });
    expect(stored!.startOffset).toBe(4);
    expect(stored!.endOffset).toBe(13);
    expect(stored!.needsReview).toBe(false);
  });

  it('flags a span whose anchor is removed from the corrected text', async () => {
    const transcript = await transcripts.findByRecordingId(RECORDING_ID);
    await prisma.annotationSpan.create({
      data: {
        id: 'span-uc-2',
        transcriptId: transcript!.id,
        spanType: 'MEDICAL_TERM',
        startOffset: 0,
        endOffset: 9,
        anchorText: 'Cefuroxim',
        attributes: { spanType: 'MEDICAL_TERM', category: 'drug' },
        needsReview: false,
      },
    });

    const result = await updateHandler.execute({
      recordingId: RECORDING_ID,
      correctedText: 'Amoxicillin 1500 mg intravenoes',
    });

    expect(result.reanchor.flagged).toBe(1);
    const stored = await prisma.annotationSpan.findUnique({ where: { id: 'span-uc-2' } });
    expect(stored!.needsReview).toBe(true);
  });

  it('recomputes WER against the immutable originalText', async () => {
    const result = await updateHandler.execute({
      recordingId: RECORDING_ID,
      correctedText: 'Cefuroxim 1500 mg IV',
    });
    // 1 substitution over 4 reference tokens = 0.25
    expect(result.transcript.werCached).toBeCloseTo(0.25, 5);
    expect(result.transcript.originalText).toBe('Cefuroxim 1500 mg intravenoes');
  });

  it('re-runs word alignment against the corrected text', async () => {
    const result = await updateHandler.execute({
      recordingId: RECORDING_ID,
      correctedText: 'aa bb',
    });
    expect(result.transcript.alignmentMethod).toBe('proportional');
    expect(result.transcript.wordTimings).toEqual([
      { w: 'aa', start: 0, end: 15 },
      { w: 'bb', start: 15, end: 30 },
    ]);
  });
});
