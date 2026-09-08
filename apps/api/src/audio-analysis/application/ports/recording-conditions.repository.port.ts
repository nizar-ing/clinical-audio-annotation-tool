export interface ConditionsRow {
  recordingId: string;
  derivedSpeechRateWpm: number;
  overrideSpeechRateWpm: number | null;
  derivedDistanceBucket: string;
  overrideDistanceBucket: string | null;
  distanceMethod: string;
}

export interface ConditionsSaveInput {
  recordingId: string;
  derivedSpeechRateWpm: number;
  derivedDistanceBucket: string;
  distanceMethod: string;
}

export interface ConditionsOverridePatch {
  overrideSpeechRateWpm?: number | null;
  overrideDistanceBucket?: string | null;
}

export interface RecordingConditionsRepositoryPort {
  findByRecordingId(recordingId: string): Promise<ConditionsRow | null>;
  save(input: ConditionsSaveInput): Promise<ConditionsRow>;
  updateOverrides(recordingId: string, patch: ConditionsOverridePatch): Promise<ConditionsRow>;
}
