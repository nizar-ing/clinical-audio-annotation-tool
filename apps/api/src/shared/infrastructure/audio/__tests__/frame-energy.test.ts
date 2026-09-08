import { describe, it, expect } from 'vitest';
import { computeFrameRms } from '../frame-energy.js';

describe('computeFrameRms', () => {
  it('returns an empty series for empty input', () => {
    expect(computeFrameRms(new Int16Array(0), 16000, 25).length).toBe(0);
  });

  it('computes RMS ≈ amplitude / √2 for a sinusoid', () => {
    // 100 Hz sine at 16 kHz, one full frame (25 ms = 400 samples), amplitude 10000.
    const sampleRate = 16000;
    const frameMs = 25;
    const frameSize = (sampleRate * frameMs) / 1000; // 400
    const amp = 10_000;
    const samples = new Int16Array(frameSize * 4);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.round(amp * Math.sin((2 * Math.PI * 100 * i) / sampleRate));
    }
    const rms = computeFrameRms(samples, sampleRate, frameMs);
    expect(rms.length).toBe(4);
    // Sine RMS is amplitude/√2 ≈ 7071.
    for (const r of rms) expect(r).toBeGreaterThan(6900);
    for (const r of rms) expect(r).toBeLessThan(7200);
  });

  it('discards a trailing partial frame', () => {
    // 25 ms at 16 kHz = 400 samples per frame. 900 samples → 2 full frames, 100-sample tail dropped.
    const samples = new Int16Array(900).fill(1000);
    expect(computeFrameRms(samples, 16000, 25).length).toBe(2);
  });

  it('measures RMS on a constant DC signal', () => {
    // For a constant signal x, RMS = |x|.
    const samples = new Int16Array(1600).fill(500);
    const rms = computeFrameRms(samples, 16000, 25);
    for (const r of rms) expect(r).toBeCloseTo(500, 5);
  });
});
