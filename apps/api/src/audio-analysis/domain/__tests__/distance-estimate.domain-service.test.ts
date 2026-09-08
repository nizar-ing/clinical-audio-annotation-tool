import { describe, it, expect } from 'vitest';
import { EnergyProfile } from '../value-objects/energy-profile.vo.js';
import { DistanceEstimateDomainService } from '../services/distance-estimate.domain-service.js';

function makeProfile(quiet: number, loud: number, quietRms: number, loudRms: number): EnergyProfile {
  const rms = new Float32Array(quiet + loud);
  for (let i = 0; i < quiet; i++) rms[i] = quietRms;
  for (let i = quiet; i < quiet + loud; i++) rms[i] = loudRms;
  return new EnergyProfile(rms, 25);
}

describe('DistanceEstimateDomainService.compute', () => {
  it('buckets very loud speech relative to noise as close', () => {
    // mean speech RMS 100, noise floor 1 → ratio 100 → close
    const result = DistanceEstimateDomainService.compute(makeProfile(10, 10, 1, 100));
    expect(result.bucket).toBe('close');
  });

  it('buckets moderate ratios as normal', () => {
    // mean speech RMS 15, noise floor 1 → ratio 15 → normal
    const result = DistanceEstimateDomainService.compute(makeProfile(10, 10, 1, 15));
    expect(result.bucket).toBe('normal');
  });

  it('buckets weak speech relative to noise as far', () => {
    // mean speech RMS 5, noise floor 1 → ratio 5 → far
    const result = DistanceEstimateDomainService.compute(makeProfile(10, 10, 1, 5));
    expect(result.bucket).toBe('far');
  });

  it('reports far when no speech frames are detected', () => {
    // constant series → no frame crosses the +6 dB threshold
    const rms = new Float32Array(10).fill(1);
    const profile = new EnergyProfile(rms, 25);
    expect(DistanceEstimateDomainService.compute(profile).bucket).toBe('far');
  });

  it('carries a method string explaining the estimate is a heuristic', () => {
    const result = DistanceEstimateDomainService.compute(makeProfile(10, 10, 1, 100));
    expect(result.method).toMatch(/RMS/);
    expect(result.method).toMatch(/heuristic/i);
  });
});
