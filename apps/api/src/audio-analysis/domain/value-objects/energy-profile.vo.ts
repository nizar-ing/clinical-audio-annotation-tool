// A +6 dB threshold above the noise floor separates speech frames from noise.
// 10^(6/20) ≈ 1.9953.
const SPEECH_THRESHOLD_RATIO = Math.pow(10, 6 / 20);

// A speech "region" shorter than this is treated as noise. 100 ms is short enough to keep phonemes
// but long enough to reject transient clicks and half-frame boundary artefacts.
const MIN_SPEECH_REGION_MS = 100;

export class EnergyProfile {
  readonly frameRms: Float32Array;
  readonly frameMs: number;
  readonly noiseFloor: number;
  readonly speechMask: readonly boolean[];
  readonly meanSpeechRms: number;

  constructor(frameRms: Float32Array, frameMs: number = 25) {
    this.frameRms = frameRms;
    this.frameMs = frameMs;
    this.noiseFloor = fifthPercentile(frameRms);
    this.speechMask = buildSpeechMask(frameRms, this.noiseFloor, frameMs);
    this.meanSpeechRms = meanOverMask(frameRms, this.speechMask);
  }

  get frameCount(): number {
    return this.frameRms.length;
  }

  get durationMs(): number {
    return this.frameRms.length * this.frameMs;
  }
}

function fifthPercentile(rms: Float32Array): number {
  if (rms.length === 0) return 0;
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const idx = Math.floor(0.05 * (sorted.length - 1));
  return sorted[idx]!;
}

function buildSpeechMask(rms: Float32Array, noiseFloor: number, frameMs: number): boolean[] {
  const threshold = noiseFloor * SPEECH_THRESHOLD_RATIO;
  const raw: boolean[] = new Array(rms.length);
  for (let i = 0; i < rms.length; i++) raw[i] = rms[i]! > threshold;

  const minFrames = Math.ceil(MIN_SPEECH_REGION_MS / frameMs);
  const mask: boolean[] = new Array(rms.length).fill(false);

  let runStart = -1;
  for (let i = 0; i <= raw.length; i++) {
    const inRun = i < raw.length && raw[i];
    if (inRun && runStart === -1) runStart = i;
    if ((!inRun || i === raw.length) && runStart !== -1) {
      const runLength = i - runStart;
      if (runLength >= minFrames) {
        for (let j = runStart; j < i; j++) mask[j] = true;
      }
      runStart = -1;
    }
  }
  return mask;
}

function meanOverMask(rms: Float32Array, mask: readonly boolean[]): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < rms.length; i++) {
    if (mask[i]) {
      sum += rms[i]!;
      count++;
    }
  }
  return count === 0 ? 0 : sum / count;
}
