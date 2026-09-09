import { join } from 'path';
import type { PrismaClient } from '@prisma/client';
import { env } from '../../shared/infrastructure/config/env.js';
import { decodePcm } from '../../shared/infrastructure/audio/pcm-decoder.js';
import { computeFrameRms, DEFAULT_FRAME_MS } from '../../shared/infrastructure/audio/frame-energy.js';
import type { AudioEnergyPort, SpeechRegion } from '../application/ports/audio-energy.port.js';

// See IMPLEMENTATION_PLAN §7.1: 25 ms frames, noise floor at the 5th percentile of
// frame RMS, threshold at +6 dB above the floor (i.e. amplitude ratio 2×), regions
// shorter than 100 ms discarded.
const NOISE_FLOOR_PERCENTILE = 0.05;
const SPEECH_THRESHOLD_AMPLITUDE_RATIO = 2; // +6 dB
const MIN_REGION_MS = 100;

export class FfmpegAudioEnergyAdapter implements AudioEnergyPort {
  private cache = new Map<string, SpeechRegion[]>();

  constructor(private readonly db: PrismaClient) {}

  async getSpeechRegions(recordingId: string): Promise<SpeechRegion[]> {
    const cached = this.cache.get(recordingId);
    if (cached) return cached;

    const rec = await this.db.recording.findUnique({
      where: { id: recordingId },
      select: { storageKey: true },
    });
    if (!rec) return [];

    let regions: SpeechRegion[];
    try {
      const filePath = join(env.UPLOADS_DIR, rec.storageKey);
      const { samples, sampleRate } = await decodePcm(filePath);
      const rms = computeFrameRms(samples, sampleRate, DEFAULT_FRAME_MS);
      regions = detectRegions(rms, DEFAULT_FRAME_MS);
    } catch {
      // Decode failed — return empty. The caller (alignment) falls back to proportional.
      regions = [];
    }

    this.cache.set(recordingId, regions);
    return regions;
  }
}

function detectRegions(frameRms: Float32Array, frameMs: number): SpeechRegion[] {
  if (frameRms.length === 0) return [];

  const sorted = Array.from(frameRms).sort((a, b) => a - b);
  const noiseFloor = sorted[Math.floor(sorted.length * NOISE_FLOOR_PERCENTILE)] ?? 0;
  // Threshold at +6 dB above the floor, but not below 1 so silence tails don't zero-out.
  const threshold = Math.max(noiseFloor * SPEECH_THRESHOLD_AMPLITUDE_RATIO, 1);

  const frameSec = frameMs / 1000;
  const rawRegions: SpeechRegion[] = [];
  let inSpeech = false;
  let regionStartFrame = 0;

  for (let i = 0; i < frameRms.length; i++) {
    const isSpeech = frameRms[i]! > threshold;
    if (isSpeech && !inSpeech) {
      inSpeech = true;
      regionStartFrame = i;
    } else if (!isSpeech && inSpeech) {
      rawRegions.push({ start: regionStartFrame * frameSec, end: i * frameSec });
      inSpeech = false;
    }
  }
  if (inSpeech) {
    rawRegions.push({ start: regionStartFrame * frameSec, end: frameRms.length * frameSec });
  }

  const minRegionSec = MIN_REGION_MS / 1000;
  return rawRegions.filter((r) => r.end - r.start >= minRegionSec);
}
