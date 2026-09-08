import { describe, it, expect } from 'vitest';
import { WordErrorRateDomainService } from '../word-error-rate.domain-service.js';

describe('WordErrorRateDomainService.compute', () => {
  it('returns 0 for identical strings', () => {
    expect(WordErrorRateDomainService.compute('hello world', 'hello world')).toBe(0);
  });

  it('counts one substitution', () => {
    // 1 substitution / 2 reference tokens = 0.5
    expect(WordErrorRateDomainService.compute('hello world', 'hello earth')).toBeCloseTo(0.5, 5);
  });

  it('counts one deletion (hypothesis missing a word)', () => {
    // 1 deletion / 3 reference tokens ≈ 0.333
    expect(WordErrorRateDomainService.compute('hello world there', 'hello world')).toBeCloseTo(1 / 3, 5);
  });

  it('counts one insertion (hypothesis has an extra word)', () => {
    // 1 insertion / 2 reference tokens = 0.5
    expect(WordErrorRateDomainService.compute('hello world', 'hello dear world')).toBeCloseTo(0.5, 5);
  });

  it('returns 1.0 when hypothesis is empty and reference is not', () => {
    expect(WordErrorRateDomainService.compute('one two three', '')).toBe(1);
  });

  it('returns the hypothesis token count when reference is empty', () => {
    expect(WordErrorRateDomainService.compute('', 'one two')).toBe(2);
  });

  it('returns 0 when both strings are empty', () => {
    expect(WordErrorRateDomainService.compute('', '')).toBe(0);
  });

  it('handles whitespace-only strings as empty', () => {
    expect(WordErrorRateDomainService.compute('  ', '\t\n')).toBe(0);
  });

  it('handles a realistic clinical correction', () => {
    const ref = 'Cefuroxim eintausendfuenfhundert Milligramm';
    const hyp = 'Cefuroxim 1500 Milligramm';
    // One substitution over 3 tokens = 0.333...
    expect(WordErrorRateDomainService.compute(ref, hyp)).toBeCloseTo(1 / 3, 5);
  });
});
