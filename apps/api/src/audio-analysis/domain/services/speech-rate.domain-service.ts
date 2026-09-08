export class SpeechRateDomainService {
  // Whitespace tokenisation is documented as a known simplification; a morphological tokeniser
  // would be needed to score compound-heavy medical German fairly. See IMPLEMENTATION_PLAN §7.2.
  static compute(transcriptText: string, durationSeconds: number): number {
    if (durationSeconds <= 0) return 0;
    const tokens = transcriptText.trim().split(/\s+/).filter((t) => t.length > 0);
    if (tokens.length === 0) return 0;
    return (tokens.length * 60) / durationSeconds;
  }
}
