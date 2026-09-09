import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../../shared/infrastructure/database/postgres/prisma.client.js';
import { PrismaTranscriptRepository } from '../../../infrastructure/prisma-transcript.repository.js';
import { PrismaRecordingReadAdapter } from '../../../infrastructure/prisma-recording-read.adapter.js';
import { CreateTranscriptHandler } from '../create-transcript/create-transcript.handler.js';
import type { AudioEnergyPort, SpeechRegion } from '../../ports/audio-energy.port.js';

const RECORDING_ID = 'test-create-transcript-recording-1';

class FakeEnergyPort implements AudioEnergyPort {
  constructor(private readonly regions: SpeechRegion[]) {}
  async getSpeechRegions(): Promise<SpeechRegion[]> {
    return this.regions;
  }
}

async function seed() {
  await prisma.transcript.deleteMany({ where: { recordingId: RECORDING_ID } });
  await prisma.recording.deleteMany({ where: { id: RECORDING_ID } });
  await prisma.recording.create({
    data: {
      id: RECORDING_ID,
      originalFilename: 'ct.wav',
      storageKey: 'ct.wav',
      mimeType: 'audio/wav',
      sizeBytes: 1000,
      durationSeconds: 30,
      sampleRate: 16000,
      channels: 1,
      status: 'QUEUED',
    },
  });
}

describe('CreateTranscriptHandler (integration)', () => {
  const transcripts = new PrismaTranscriptRepository(prisma);
  const recordings = new PrismaRecordingReadAdapter(prisma);

  beforeAll(async () => {
    await seed();
  });

  afterAll(async () => {
    await prisma.transcript.deleteMany({ where: { recordingId: RECORDING_ID } });
    await prisma.recording.deleteMany({ where: { id: RECORDING_ID } });
    await prisma.$disconnect();
  });

  it('persists a transcript, seeds corrected = original, aligns proportionally when no regions', async () => {
    const handler = new CreateTranscriptHandler(transcripts, recordings, new FakeEnergyPort([]));
    const t = await handler.execute({ recordingId: RECORDING_ID, originalText: 'aaa bbb ccc' });

    expect(t.originalText).toBe('aaa bbb ccc');
    expect(t.correctedText).toBe('aaa bbb ccc');
    expect(t.werCached).toBe(0);
    expect(t.alignmentMethod).toBe('proportional');
    expect(t.wordTimings).toEqual([
      { w: 'aaa', start: 0, end: 10 },
      { w: 'bbb', start: 10, end: 20 },
      { w: 'ccc', start: 20, end: 30 },
    ]);
  });

  it('uses energy-gated alignment when regions are supplied', async () => {
    await prisma.transcript.deleteMany({ where: { recordingId: RECORDING_ID } });
    const handler = new CreateTranscriptHandler(
      transcripts,
      recordings,
      new FakeEnergyPort([{ start: 0, end: 15 }, { start: 20, end: 30 }]),
    );
    const t = await handler.execute({ recordingId: RECORDING_ID, originalText: 'a b c' });
    expect(t.alignmentMethod).toBe('energy-gated');
    expect(t.wordTimings).not.toBeNull();
  });

  it('refuses a second transcript for the same recording', async () => {
    const handler = new CreateTranscriptHandler(transcripts, recordings, new FakeEnergyPort([]));
    await expect(
      handler.execute({ recordingId: RECORDING_ID, originalText: 'anything' }),
    ).rejects.toThrow(/already exists/);
  });

  it('rejects empty originalText', async () => {
    const handler = new CreateTranscriptHandler(transcripts, recordings, new FakeEnergyPort([]));
    await expect(
      handler.execute({ recordingId: 'irrelevant', originalText: '   ' }),
    ).rejects.toThrow(/cannot be empty/);
  });

  it('throws NotFound when the recording does not exist', async () => {
    const handler = new CreateTranscriptHandler(transcripts, recordings, new FakeEnergyPort([]));
    await expect(
      handler.execute({ recordingId: 'no-such-recording', originalText: 'hello' }),
    ).rejects.toThrow(/not found/);
  });
});
