export interface ExportSpan {
  spanType: string;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  attributes: Record<string, unknown>;
  needsReview: boolean;
}

export interface ExportRecord {
  audioFilename: string;
  storageKey: string;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  originalTranscript: string;
  correctedTranscript: string;
  wordErrorRate: number;
  alignmentMethod: string;
  wordTimings: Array<{ w: string; start: number; end: number }> | null;
  conditions: {
    speechRateWpm: number;
    speechRateSource: 'derived' | 'override';
    distanceBucket: string;
    distanceMethod: string;
  };
  spans: ExportSpan[];
  exportedAt: string;
}
