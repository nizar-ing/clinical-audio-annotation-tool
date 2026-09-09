import { describe, expect, it } from 'vitest';
import { GoldStandardAssembler } from '../gold-standard.assembler.js';

const recording = {
  originalFilename: 'demo-05.wav',
  storageKey: 'abc123.wav',
};

const transcript = {
  originalText: 'Der Patient nahm Cefuroxim einmal täglich.',
  correctedText: 'Der Patient nahm Cefuroxim 1500 mg einmal täglich.',
  werCached: 0.2,
  alignmentMethod: 'proportional',
  wordTimings: [
    { w: 'Der', start: 0.0, end: 0.3 },
    { w: 'Patient', start: 0.3, end: 0.9 },
  ],
};

const conditions = {
  audio: { durationSeconds: 30.5, sampleRate: 16000, channels: 1 },
  derived: { speechRateWpm: 142, distanceBucket: 'normal' },
  override: { speechRateWpm: null, distanceBucket: null },
  final: { speechRateWpm: 142, distanceBucket: 'normal' },
  distanceMethod: 'RMS-to-noise-floor ratio; heuristic',
};

const spans = [
  {
    spanType: 'MEASUREMENT',
    startOffset: 25,
    endOffset: 32,
    anchorText: '1500 mg',
    attributes: { spanType: 'MEASUREMENT', value: 1500, unit: 'mg', normalised: null },
    needsReview: false,
  },
];

const exportedAt = new Date('2026-01-15T10:00:00.000Z');

describe('GoldStandardAssembler', () => {
  it('assembles all fields correctly', () => {
    const row = GoldStandardAssembler.assemble(recording, transcript, conditions, spans, exportedAt);

    expect(row.audioFilename).toBe('demo-05.wav');
    expect(row.storageKey).toBe('abc123.wav');
    expect(row.durationSeconds).toBe(30.5);
    expect(row.sampleRate).toBe(16000);
    expect(row.channels).toBe(1);
    expect(row.originalTranscript).toBe('Der Patient nahm Cefuroxim einmal täglich.');
    expect(row.correctedTranscript).toBe('Der Patient nahm Cefuroxim 1500 mg einmal täglich.');
    expect(row.wordErrorRate).toBe(0.2);
    expect(row.alignmentMethod).toBe('proportional');
    expect(row.wordTimings).toHaveLength(2);
    expect(row.exportedAt).toBe('2026-01-15T10:00:00.000Z');
  });

  it('sets speechRateSource to derived when no override', () => {
    const row = GoldStandardAssembler.assemble(recording, transcript, conditions, spans, exportedAt);
    expect(row.conditions.speechRateSource).toBe('derived');
  });

  it('sets speechRateSource to override when override is present', () => {
    const overriddenConditions = {
      ...conditions,
      override: { speechRateWpm: 160, distanceBucket: null },
      final: { speechRateWpm: 160, distanceBucket: 'normal' },
    };
    const row = GoldStandardAssembler.assemble(recording, transcript, overriddenConditions, spans, exportedAt);
    expect(row.conditions.speechRateSource).toBe('override');
    expect(row.conditions.speechRateWpm).toBe(160);
  });

  it('carries spans with all attributes preserved', () => {
    const row = GoldStandardAssembler.assemble(recording, transcript, conditions, spans, exportedAt);
    expect(row.spans).toHaveLength(1);
    expect(row.spans[0]!.spanType).toBe('MEASUREMENT');
    expect(row.spans[0]!.attributes).toEqual({
      spanType: 'MEASUREMENT',
      value: 1500,
      unit: 'mg',
      normalised: null,
    });
    expect(row.spans[0]!.needsReview).toBe(false);
  });

  it('carries distanceMethod string through to export', () => {
    const row = GoldStandardAssembler.assemble(recording, transcript, conditions, spans, exportedAt);
    expect(row.conditions.distanceMethod).toBe('RMS-to-noise-floor ratio; heuristic');
  });

  it('produces empty spans array when no spans given', () => {
    const row = GoldStandardAssembler.assemble(recording, transcript, conditions, [], exportedAt);
    expect(row.spans).toEqual([]);
  });

  it('preserves null wordTimings', () => {
    const noTimings = { ...transcript, wordTimings: null };
    const row = GoldStandardAssembler.assemble(recording, noTimings, conditions, [], exportedAt);
    expect(row.wordTimings).toBeNull();
  });
});
