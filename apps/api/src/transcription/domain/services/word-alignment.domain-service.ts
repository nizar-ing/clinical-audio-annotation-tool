import type { WordAlignment, AlignmentMethod } from '../value-objects/word-alignment.vo.js';

export interface AlignmentInput {
  tokens: string[];
  duration: number;
  energyRegions?: { start: number; end: number }[];
}

export interface AlignmentResult {
  words: WordAlignment[];
  method: AlignmentMethod;
}

// Estimated word-level timings. Two tiers:
// - proportional: tokens spread over `duration` proportionally to character length.
// - energy-gated: tokens distributed across pre-computed speech regions (silence skipped).
// Both are labelled as estimates all the way to the export — no derived value is
// ever presented as a measurement.
export class WordAlignmentDomainService {
  static align(input: AlignmentInput): AlignmentResult {
    const cleaned = input.tokens.map((t) => t.trim()).filter((t) => t.length > 0);
    if (cleaned.length === 0) {
      return { words: [], method: 'proportional' };
    }

    if (input.energyRegions && input.energyRegions.length > 0) {
      return this.energyGated(cleaned, input.energyRegions);
    }
    return this.proportional(cleaned, input.duration);
  }

  private static proportional(tokens: string[], duration: number): AlignmentResult {
    const totalChars = tokens.reduce((sum, t) => sum + t.length, 0);
    if (duration <= 0 || totalChars === 0) {
      return { words: tokens.map((w) => ({ w, start: 0, end: 0 })), method: 'proportional' };
    }

    const words: WordAlignment[] = [];
    let charsSoFar = 0;
    for (const token of tokens) {
      const start = (charsSoFar / totalChars) * duration;
      const end = ((charsSoFar + token.length) / totalChars) * duration;
      words.push({ w: token, start, end });
      charsSoFar += token.length;
    }
    return { words, method: 'proportional' };
  }

  private static energyGated(tokens: string[], regions: { start: number; end: number }[]): AlignmentResult {
    const totalChars = tokens.reduce((sum, t) => sum + t.length, 0);
    const totalSpeech = regions.reduce((sum, r) => sum + (r.end - r.start), 0);
    if (totalChars === 0 || totalSpeech <= 0) {
      return { words: tokens.map((w) => ({ w, start: 0, end: 0 })), method: 'energy-gated' };
    }

    const words: WordAlignment[] = [];
    let speechSoFar = 0;
    for (const token of tokens) {
      const slice = (token.length / totalChars) * totalSpeech;
      const start = speechTimeToReal(speechSoFar, regions);
      const end = speechTimeToReal(speechSoFar + slice, regions);
      words.push({ w: token, start, end });
      speechSoFar += slice;
    }
    return { words, method: 'energy-gated' };
  }
}

// Maps a cumulative "elapsed speech time" onto real-audio time by walking the
// regions in order. Silence gaps between regions are skipped — a token whose
// slice crosses a boundary lands with a start in one region and an end in the
// next, which is the semantically honest thing to do with a pause.
function speechTimeToReal(speechTime: number, regions: { start: number; end: number }[]): number {
  let elapsed = 0;
  for (const region of regions) {
    const regionLen = region.end - region.start;
    if (speechTime <= elapsed + regionLen) {
      return region.start + (speechTime - elapsed);
    }
    elapsed += regionLen;
  }
  // Beyond the total speech duration: clamp to the tail of the last region.
  const last = regions[regions.length - 1]!;
  return last.end;
}
