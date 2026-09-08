export type DistanceBucket = 'close' | 'normal' | 'far';

// Ratios are speech-to-noise-floor. Thresholds are heuristics, not calibrated. Documented in DESIGN.md.
const CLOSE_MIN = 25;
const NORMAL_MIN = 8;

export function bucketFromRatio(ratio: number): DistanceBucket {
  if (ratio >= CLOSE_MIN) return 'close';
  if (ratio >= NORMAL_MIN) return 'normal';
  return 'far';
}
