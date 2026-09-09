import type { ExportRecord, ExportSpan } from '../value-objects/export-record.vo.js';

export interface AssemblerRecording {
  originalFilename: string;
  storageKey: string;
}

export interface AssemblerTranscript {
  originalText: string;
  correctedText: string;
  werCached: number;
  alignmentMethod: string;
  wordTimings: Array<{ w: string; start: number; end: number }> | null;
}

export interface AssemblerConditions {
  audio: { durationSeconds: number; sampleRate: number; channels: number };
  derived: { speechRateWpm: number; distanceBucket: string };
  override: { speechRateWpm: number | null; distanceBucket: string | null };
  final: { speechRateWpm: number; distanceBucket: string };
  distanceMethod: string;
}

export interface AssemblerSpan {
  spanType: string;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  attributes: Record<string, unknown>;
  needsReview: boolean;
}

export class GoldStandardAssembler {
  static assemble(
    recording: AssemblerRecording,
    transcript: AssemblerTranscript,
    conditions: AssemblerConditions,
    spans: AssemblerSpan[],
    exportedAt: Date,
  ): ExportRecord {
    const speechRateSource: 'derived' | 'override' =
      conditions.override.speechRateWpm !== null ? 'override' : 'derived';

    return {
      audioFilename: recording.originalFilename,
      storageKey: recording.storageKey,
      durationSeconds: conditions.audio.durationSeconds,
      sampleRate: conditions.audio.sampleRate,
      channels: conditions.audio.channels,
      originalTranscript: transcript.originalText,
      correctedTranscript: transcript.correctedText,
      wordErrorRate: transcript.werCached,
      alignmentMethod: transcript.alignmentMethod,
      wordTimings: transcript.wordTimings,
      conditions: {
        speechRateWpm: conditions.final.speechRateWpm,
        speechRateSource,
        distanceBucket: conditions.final.distanceBucket,
        distanceMethod: conditions.distanceMethod,
      },
      spans: spans.map((s): ExportSpan => ({
        spanType: s.spanType,
        startOffset: s.startOffset,
        endOffset: s.endOffset,
        anchorText: s.anchorText,
        attributes: s.attributes,
        needsReview: s.needsReview,
      })),
      exportedAt: exportedAt.toISOString(),
    };
  }
}
