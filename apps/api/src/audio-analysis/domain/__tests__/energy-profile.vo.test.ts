import { describe, it, expect } from 'vitest';
import { EnergyProfile } from '../value-objects/energy-profile.vo.js';

describe('EnergyProfile', () => {
  it('takes the noise floor as the fifth percentile of frame RMS', () => {
    // 20 frames: 10 at rms=1, 5 at rms=10, 5 at rms=100 → 5th percentile is 1
    const rms = new Float32Array([
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      10, 10, 10, 10, 10,
      100, 100, 100, 100, 100,
    ]);
    const profile = new EnergyProfile(rms, 25);
    expect(profile.noiseFloor).toBe(1);
  });

  it('marks frames more than 6 dB above the noise floor as speech', () => {
    // noise floor 1 → threshold ≈ 1.995. rms 10 clearly above, rms 1 clearly below
    const rms = new Float32Array(20);
    for (let i = 0; i < 15; i++) rms[i] = 1;
    for (let i = 15; i < 20; i++) rms[i] = 10;
    const profile = new EnergyProfile(rms, 25);
    expect(profile.speechMask.slice(0, 15).every((v) => v === false)).toBe(true);
    expect(profile.speechMask.slice(15, 20).every((v) => v === true)).toBe(true);
  });

  it('discards speech regions shorter than 100 ms', () => {
    // 3 frames * 25 ms = 75 ms — below the 100 ms floor; must be dropped
    const rms = new Float32Array(20);
    for (let i = 0; i < 8; i++) rms[i] = 1;
    for (let i = 8; i < 11; i++) rms[i] = 100;
    for (let i = 11; i < 20; i++) rms[i] = 1;
    const profile = new EnergyProfile(rms, 25);
    expect(profile.speechMask.slice(8, 11).every((v) => v === false)).toBe(true);
  });

  it('keeps speech regions of exactly 100 ms', () => {
    // 4 frames * 25 ms = 100 ms — the boundary. Kept.
    const rms = new Float32Array(20);
    for (let i = 0; i < 8; i++) rms[i] = 1;
    for (let i = 8; i < 12; i++) rms[i] = 100;
    for (let i = 12; i < 20; i++) rms[i] = 1;
    const profile = new EnergyProfile(rms, 25);
    expect(profile.speechMask.slice(8, 12).every((v) => v === true)).toBe(true);
  });

  it('exposes the mean RMS over the speech-masked frames', () => {
    const rms = new Float32Array(20);
    for (let i = 0; i < 10; i++) rms[i] = 1;
    for (let i = 10; i < 20; i++) rms[i] = 50; // 10 frames > 100 ms, all pass
    const profile = new EnergyProfile(rms, 25);
    expect(profile.meanSpeechRms).toBeCloseTo(50, 5);
  });

  it('reports zero mean speech RMS when no speech frames survive', () => {
    // A constant series: 5th percentile equals every value → nothing exceeds the +6 dB threshold
    const rms = new Float32Array(10).fill(1);
    const profile = new EnergyProfile(rms, 25);
    expect(profile.speechMask.every((v) => v === false)).toBe(true);
    expect(profile.meanSpeechRms).toBe(0);
  });
});
