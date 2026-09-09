import { describe, it, expect } from 'vitest';
import { WordAlignmentDomainService } from '../word-alignment.domain-service.js';

describe('WordAlignmentDomainService.align', () => {
  it('spreads three equal-length tokens linearly over the duration (no regions)', () => {
    const result = WordAlignmentDomainService.align({
      tokens: ['aaa', 'bbb', 'ccc'],
      duration: 30,
    });

    expect(result.method).toBe('proportional');
    expect(result.words).toEqual([
      { w: 'aaa', start: 0, end: 10 },
      { w: 'bbb', start: 10, end: 20 },
      { w: 'ccc', start: 20, end: 30 },
    ]);
  });

  it('spreads tokens proportionally to their character length', () => {
    // Chars: 2 + 4 + 2 = 8; over 8 seconds → tokens are 2s, 4s, 2s
    const result = WordAlignmentDomainService.align({
      tokens: ['aa', 'bbbb', 'cc'],
      duration: 8,
    });

    expect(result.words).toEqual([
      { w: 'aa', start: 0, end: 2 },
      { w: 'bbbb', start: 2, end: 6 },
      { w: 'cc', start: 6, end: 8 },
    ]);
  });

  it('returns an empty result for empty tokens', () => {
    const result = WordAlignmentDomainService.align({ tokens: [], duration: 30 });
    expect(result.words).toEqual([]);
    expect(result.method).toBe('proportional');
  });

  it('handles zero duration by returning zero-length words', () => {
    const result = WordAlignmentDomainService.align({ tokens: ['a', 'b'], duration: 0 });
    expect(result.words).toEqual([
      { w: 'a', start: 0, end: 0 },
      { w: 'b', start: 0, end: 0 },
    ]);
  });

  it('falls back to proportional when regions are provided but empty', () => {
    const result = WordAlignmentDomainService.align({
      tokens: ['aa', 'bb'],
      duration: 4,
      energyRegions: [],
    });
    expect(result.method).toBe('proportional');
    expect(result.words).toEqual([
      { w: 'aa', start: 0, end: 2 },
      { w: 'bb', start: 2, end: 4 },
    ]);
  });

  it('distributes tokens across two speech regions and skips silence', () => {
    // Two regions of 10s each = 20s total speech; 5 tokens of 2 chars = 10 chars → each token = 4s speech
    // token 0: speech 0–4 → all in region 1 (starts at 0) → real 0–4
    // token 1: speech 4–8 → all in region 1 → real 4–8
    // token 2: speech 8–12 → 8–10 in region 1, 10–12 in region 2 (starts real 15) → real 8–17
    // token 3: speech 12–16 → all in region 2 (offset from real 15) → real 17–21
    // token 4: speech 16–20 → all in region 2 → real 21–25
    const result = WordAlignmentDomainService.align({
      tokens: ['aa', 'bb', 'cc', 'dd', 'ee'],
      duration: 30,
      energyRegions: [
        { start: 0, end: 10 },
        { start: 15, end: 25 },
      ],
    });

    expect(result.method).toBe('energy-gated');
    expect(result.words).toEqual([
      { w: 'aa', start: 0, end: 4 },
      { w: 'bb', start: 4, end: 8 },
      { w: 'cc', start: 8, end: 17 },
      { w: 'dd', start: 17, end: 21 },
      { w: 'ee', start: 21, end: 25 },
    ]);
  });

  it('produces the same result as proportional when a single region spans the whole audio', () => {
    const result = WordAlignmentDomainService.align({
      tokens: ['aa', 'bb'],
      duration: 4,
      energyRegions: [{ start: 0, end: 4 }],
    });
    expect(result.method).toBe('energy-gated');
    expect(result.words).toEqual([
      { w: 'aa', start: 0, end: 2 },
      { w: 'bb', start: 2, end: 4 },
    ]);
  });

  it('filters out whitespace-only tokens before distributing', () => {
    const result = WordAlignmentDomainService.align({
      tokens: ['a', '', ' ', 'b'],
      duration: 2,
    });
    expect(result.words).toEqual([
      { w: 'a', start: 0, end: 1 },
      { w: 'b', start: 1, end: 2 },
    ]);
  });
});
