export interface ConditionsDto {
  recordingId: string;
  headerMetadata: unknown | null;
  audio: {
    mimeType: string;
    durationSeconds: number;
    sampleRate: number;
    channels: number;
    bitDepth: number | null;
  };
  derived: {
    speechRateWpm: number;
    distanceBucket: string;
  };
  override: {
    speechRateWpm: number | null;
    distanceBucket: string | null;
  };
  // final = override ?? derived, per IMPLEMENTATION_PLAN §9 (override precedence).
  final: {
    speechRateWpm: number;
    distanceBucket: string;
  };
  distanceMethod: string;
}
