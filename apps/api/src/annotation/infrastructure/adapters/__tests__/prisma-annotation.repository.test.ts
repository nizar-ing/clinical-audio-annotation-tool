import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../../shared/infrastructure/database/postgres/prisma.client.js';
import { PrismaAnnotationRepository } from '../prisma-annotation.repository.js';
import { AnnotationSpan } from '../../../domain/entities/annotation-span.entity.js';
import { SpanOffsets } from '../../../domain/value-objects/span-offsets.vo.js';

const RECORDING_ID = 'test-repo-recording-1';
const TRANSCRIPT_ID = 'test-repo-transcript-1';

async function seedFixture() {
  await prisma.annotationSpan.deleteMany({ where: { transcriptId: TRANSCRIPT_ID } });
  await prisma.transcript.deleteMany({ where: { id: TRANSCRIPT_ID } });
  await prisma.recording.deleteMany({ where: { id: RECORDING_ID } });

  await prisma.recording.create({
    data: {
      id: RECORDING_ID,
      originalFilename: 'test.wav',
      storageKey: 'test.wav',
      mimeType: 'audio/wav',
      sizeBytes: 1000,
      durationSeconds: 30,
      sampleRate: 16000,
      channels: 1,
      status: 'QUEUED',
    },
  });

  await prisma.transcript.create({
    data: {
      id: TRANSCRIPT_ID,
      recordingId: RECORDING_ID,
      originalText: 'Cefuroxim 1500 mg intravenous',
      correctedText: 'Cefuroxim 1500 mg intravenös',
      alignmentMethod: 'none',
    },
  });
}

const repo = new PrismaAnnotationRepository(prisma);

function makeSpan(id: string): AnnotationSpan {
  return AnnotationSpan.create(id, {
    transcriptId: TRANSCRIPT_ID,
    spanType: 'MEASUREMENT',
    offsets: SpanOffsets.create(10, 17, 28),
    anchorText: '1500 mg',
    attributes: { spanType: 'MEASUREMENT', value: 1500, unit: 'mg', normalizedValue: 1.5, normalizedUnit: 'g' },
    needsReview: false,
    createdAt: new Date(),
  });
}

describe('PrismaAnnotationRepository (integration)', () => {
  beforeAll(async () => {
    await seedFixture();
  });

  afterAll(async () => {
    await prisma.annotationSpan.deleteMany({ where: { transcriptId: TRANSCRIPT_ID } });
    await prisma.transcript.deleteMany({ where: { id: TRANSCRIPT_ID } });
    await prisma.recording.deleteMany({ where: { id: RECORDING_ID } });
    await prisma.$disconnect();
  });

  it('saves a span and retrieves it by id', async () => {
    const span = makeSpan('span-test-1');
    await repo.save(span);

    const found = await repo.findById('span-test-1');
    expect(found).not.toBeNull();
    expect(found!.spanType).toBe('MEASUREMENT');
    expect(found!.anchorText).toBe('1500 mg');
    expect(found!.offsets.start).toBe(10);
    expect(found!.offsets.end).toBe(17);
    expect(found!.attributes).toMatchObject({ value: 1500, unit: 'mg', normalizedValue: 1.5 });
  });

  it('finds all spans for a recording via transcript join', async () => {
    const span = makeSpan('span-test-2');
    await repo.save(span);

    const spans = await repo.findByRecordingId(RECORDING_ID);
    const ids = spans.map((s) => s.id);
    expect(ids).toContain('span-test-1');
    expect(ids).toContain('span-test-2');
  });

  it('resolves transcript id from recording id', async () => {
    const tid = await repo.findTranscriptIdByRecordingId(RECORDING_ID);
    expect(tid).toBe(TRANSCRIPT_ID);
  });

  it('returns null for a recording with no transcript', async () => {
    const tid = await repo.findTranscriptIdByRecordingId('nonexistent-recording');
    expect(tid).toBeNull();
  });

  it('updates a span via upsert', async () => {
    const span = await repo.findById('span-test-1');
    span!.updateAttributes({ spanType: 'MEASUREMENT', value: 2000, unit: 'mg', normalizedValue: 2, normalizedUnit: 'g' });
    await repo.save(span!);

    const updated = await repo.findById('span-test-1');
    expect((updated!.attributes as unknown as { value: number }).value).toBe(2000);
  });

  it('deletes a span', async () => {
    await repo.delete('span-test-2');
    const found = await repo.findById('span-test-2');
    expect(found).toBeNull();
  });

  it('needsReview round-trips correctly', async () => {
    const span = makeSpan('span-test-3');
    span.flagForReview();
    await repo.save(span);

    const found = await repo.findById('span-test-3');
    expect(found!.needsReview).toBe(true);
  });

  it('returns empty list for recording with no transcript', async () => {
    const spans = await repo.findByRecordingId('no-such-recording');
    expect(spans).toEqual([]);
  });
});
