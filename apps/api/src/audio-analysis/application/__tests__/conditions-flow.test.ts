import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyzeRecordingHandler } from '../use-cases/analyze-recording/analyze-recording.handler.js';
import { GetConditionsHandler } from '../use-cases/get-conditions/get-conditions.handler.js';
import { OverrideConditionsHandler } from '../use-cases/override-conditions/override-conditions.handler.js';
import type {
  ConditionsOverridePatch,
  ConditionsRow,
  ConditionsSaveInput,
  RecordingConditionsRepositoryPort,
} from '../ports/recording-conditions.repository.port.js';
import type {
  RecordingReadModel,
  RecordingReadPort,
} from '../ports/recording-read.port.js';
import type { RecordingHeaderMetadataWritePort } from '../ports/recording-header-metadata.write.port.js';
import type { TranscriptReadPort } from '../ports/transcript-read.port.js';
import type { AudioDecoderPort } from '../ports/audio-decoder.port.js';
import type { AudioHeaderReaderPort } from '../ports/audio-header-reader.port.js';

class FakeConditionsRepo implements RecordingConditionsRepositoryPort {
  private readonly rows = new Map<string, ConditionsRow>();
  async findByRecordingId(id: string): Promise<ConditionsRow | null> {
    return this.rows.get(id) ?? null;
  }
  async save(input: ConditionsSaveInput): Promise<ConditionsRow> {
    const existing = this.rows.get(input.recordingId);
    const row: ConditionsRow = {
      recordingId: input.recordingId,
      derivedSpeechRateWpm: input.derivedSpeechRateWpm,
      derivedDistanceBucket: input.derivedDistanceBucket,
      distanceMethod: input.distanceMethod,
      overrideSpeechRateWpm: existing?.overrideSpeechRateWpm ?? null,
      overrideDistanceBucket: existing?.overrideDistanceBucket ?? null,
    };
    this.rows.set(input.recordingId, row);
    return row;
  }
  async updateOverrides(id: string, patch: ConditionsOverridePatch): Promise<ConditionsRow> {
    const row = this.rows.get(id);
    if (!row) throw new Error('not found');
    if (patch.overrideSpeechRateWpm !== undefined) row.overrideSpeechRateWpm = patch.overrideSpeechRateWpm;
    if (patch.overrideDistanceBucket !== undefined) row.overrideDistanceBucket = patch.overrideDistanceBucket;
    return row;
  }
}

class FakeRecordingRead implements RecordingReadPort {
  constructor(private readonly rec: RecordingReadModel) {}
  async findById(id: string): Promise<RecordingReadModel | null> {
    return id === this.rec.id ? this.rec : null;
  }
}

class FakeHeaderWrite implements RecordingHeaderMetadataWritePort {
  updates: Array<{ id: string; header: unknown }> = [];
  async update(id: string, header: unknown): Promise<void> {
    this.updates.push({ id, header });
  }
}

class FakeTranscriptRead implements TranscriptReadPort {
  constructor(private readonly text: string | null) {}
  async findByRecordingId() {
    return this.text ? { correctedText: this.text } : null;
  }
}

// A decoder that pre-produces speech-vs-noise samples so the pipeline's distance and speech-rate outputs
// are deterministic without touching ffmpeg.
class FakeDecoder implements AudioDecoderPort {
  async decode() {
    // 25 ms frames @ 16 kHz = 400 samples/frame. Silence: 20 frames of amp 100; speech: 20 frames of amp 10000.
    const framesQuiet = 20;
    const framesLoud = 20;
    const samplesPerFrame = 400;
    const total = (framesQuiet + framesLoud) * samplesPerFrame;
    const samples = new Int16Array(total);
    for (let i = 0; i < framesQuiet * samplesPerFrame; i++) samples[i] = 100;
    for (let i = framesQuiet * samplesPerFrame; i < total; i++) samples[i] = 10_000;
    return { samples, sampleRate: 16_000 };
  }
}

class FakeHeaderReader implements AudioHeaderReaderPort {
  constructor(private readonly header: unknown) {}
  async read() {
    return this.header as never;
  }
}

const RECORDING: RecordingReadModel = {
  id: 'rec-1',
  storageKey: 'rec-1.wav',
  mimeType: 'audio/wav',
  durationSeconds: 40,
  sampleRate: 44100,
  channels: 1,
  bitDepth: 16,
  headerMetadata: null,
};

function buildWiring(overrides?: { transcript?: string | null; header?: unknown }) {
  const conditions = new FakeConditionsRepo();
  const recordings = new FakeRecordingRead({ ...RECORDING });
  const headerWrite = new FakeHeaderWrite();
  const transcriptText =
    overrides && 'transcript' in overrides ? overrides.transcript : 'one two three four five six seven eight';
  const transcripts = new FakeTranscriptRead(transcriptText ?? null);
  const decoder = new FakeDecoder();
  const headerReader = new FakeHeaderReader(overrides?.header ?? { listInfo: { INAM: 'Test' } });

  const analyze = new AnalyzeRecordingHandler(
    recordings,
    headerWrite,
    transcripts,
    conditions,
    decoder,
    headerReader,
  );
  const get = new GetConditionsHandler(recordings, conditions, analyze);
  const override = new OverrideConditionsHandler(recordings, conditions);
  return { conditions, recordings, headerWrite, get, override };
}

describe('conditions flow (wiring)', () => {
  let w: ReturnType<typeof buildWiring>;
  beforeEach(() => {
    w = buildWiring();
  });

  it('lazy-analyses on first GET and reflects both derived and final blocks', async () => {
    const dto = await w.get.execute({ recordingId: 'rec-1' });
    expect(dto.derived.speechRateWpm).toBeCloseTo(12, 5); // 8 tokens over 40 s
    expect(dto.derived.distanceBucket).toBe('close'); // loud speech vs. noise
    expect(dto.override.speechRateWpm).toBeNull();
    expect(dto.override.distanceBucket).toBeNull();
    expect(dto.final.speechRateWpm).toBeCloseTo(12, 5);
    expect(dto.final.distanceBucket).toBe('close');
    expect(dto.distanceMethod).toMatch(/heuristic/i);
    expect(dto.audio.mimeType).toBe('audio/wav');
  });

  it('writes RIFF header metadata on first analyze when Recording.headerMetadata is null', async () => {
    await w.get.execute({ recordingId: 'rec-1' });
    expect(w.headerWrite.updates).toHaveLength(1);
    expect(w.headerWrite.updates[0]).toEqual({ id: 'rec-1', header: { listInfo: { INAM: 'Test' } } });
  });

  it('is idempotent: a second GET does not re-analyse and does not rewrite header metadata', async () => {
    await w.get.execute({ recordingId: 'rec-1' });
    await w.get.execute({ recordingId: 'rec-1' });
    expect(w.headerWrite.updates).toHaveLength(1);
  });

  it('resolves final = override when set, and clears back to derived when nulled', async () => {
    await w.get.execute({ recordingId: 'rec-1' });
    const patched = await w.override.execute({ recordingId: 'rec-1', speechRateWpm: 150 });
    expect(patched.override.speechRateWpm).toBe(150);
    expect(patched.final.speechRateWpm).toBe(150);
    expect(patched.derived.speechRateWpm).toBeCloseTo(12, 5);

    const cleared = await w.override.execute({ recordingId: 'rec-1', speechRateWpm: null });
    expect(cleared.override.speechRateWpm).toBeNull();
    expect(cleared.final.speechRateWpm).toBeCloseTo(12, 5);
  });

  it('records speechRateWpm = 0 when no transcript exists yet', async () => {
    const w2 = buildWiring({ transcript: null });
    const dto = await w2.get.execute({ recordingId: 'rec-1' });
    expect(dto.derived.speechRateWpm).toBe(0);
    expect(dto.final.speechRateWpm).toBe(0);
  });

  it('rejects override before any analysis has been recorded', async () => {
    // GET has not been called, so no conditions row exists yet.
    await expect(w.override.execute({ recordingId: 'rec-1', speechRateWpm: 100 })).rejects.toThrow(
      /No conditions recorded yet/,
    );
  });

  it('404s when the recording does not exist', async () => {
    await expect(w.get.execute({ recordingId: 'nope' })).rejects.toThrow(/not found/i);
  });
});
