export const DEFAULT_FRAME_MS = 25;

// Non-overlapping frames of `frameMs`. Returns one RMS value per frame.
// Pure function — audio-analysis (distance) and future word-alignment both feed off this same series.
export function computeFrameRms(
  samples: Int16Array,
  sampleRate: number,
  frameMs: number = DEFAULT_FRAME_MS,
): Float32Array {
  if (samples.length === 0) return new Float32Array(0);
  const frameSize = Math.max(1, Math.floor((sampleRate * frameMs) / 1000));
  const frameCount = Math.floor(samples.length / frameSize);
  const out = new Float32Array(frameCount);

  for (let f = 0; f < frameCount; f++) {
    const start = f * frameSize;
    let sumSquares = 0;
    for (let i = 0; i < frameSize; i++) {
      const s = samples[start + i]!;
      sumSquares += s * s;
    }
    out[f] = Math.sqrt(sumSquares / frameSize);
  }
  return out;
}
