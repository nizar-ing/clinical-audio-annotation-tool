import { EnergyProfile } from '../value-objects/energy-profile.vo.js';
import { bucketFromRatio, type DistanceBucket } from '../value-objects/distance-bucket.vo.js';

export const DISTANCE_METHOD =
  'RMS-to-noise-floor ratio over 25 ms frames; heuristic, not a calibrated measurement';

export interface DistanceEstimate {
  bucket: DistanceBucket;
  method: string;
}

export class DistanceEstimateDomainService {
  static compute(profile: EnergyProfile): DistanceEstimate {
    const noiseFloor = profile.noiseFloor;
    const meanSpeech = profile.meanSpeechRms;
    // Falls back to 'far' when there's no detectable speech or a zero noise floor (silence).
    const ratio = noiseFloor > 0 && meanSpeech > 0 ? meanSpeech / noiseFloor : 0;
    return { bucket: bucketFromRatio(ratio), method: DISTANCE_METHOD };
  }
}
