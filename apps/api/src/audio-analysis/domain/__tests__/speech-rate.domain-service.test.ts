import { describe, it, expect } from 'vitest';
import { SpeechRateDomainService } from '../services/speech-rate.domain-service.js';

describe('SpeechRateDomainService.compute', () => {
  it('computes WPM as tokens per minute', () => {
    // 5 tokens over 30 seconds → 10 WPM
    expect(SpeechRateDomainService.compute('one two three four five', 30)).toBeCloseTo(10, 5);
  });

  it('treats consecutive whitespace as a single delimiter', () => {
    expect(SpeechRateDomainService.compute('one   two\tthree', 60)).toBeCloseTo(3, 5);
  });

  it('strips leading and trailing whitespace before tokenising', () => {
    expect(SpeechRateDomainService.compute('  one two  ', 60)).toBeCloseTo(2, 5);
  });

  it('returns zero for empty or whitespace-only text', () => {
    expect(SpeechRateDomainService.compute('', 30)).toBe(0);
    expect(SpeechRateDomainService.compute('   \t\n', 30)).toBe(0);
  });

  it('returns zero when duration is zero or negative', () => {
    expect(SpeechRateDomainService.compute('some words here', 0)).toBe(0);
    expect(SpeechRateDomainService.compute('some words here', -1)).toBe(0);
  });

  it('handles a realistic clinical dictation', () => {
    // 9 tokens over 40 seconds → 13.5 WPM
    const text = 'Kontrollierte Rückenlagerung des Patienten mit Cefuroxim 1500 mg intravenös';
    expect(SpeechRateDomainService.compute(text, 40)).toBeCloseTo(13.5, 5);
  });
});
