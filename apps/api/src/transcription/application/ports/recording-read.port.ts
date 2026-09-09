export interface TranscriptRecordingSummary {
  id: string;
  storageKey: string;
  durationSeconds: number;
}

export interface RecordingReadPort {
  findById(id: string): Promise<TranscriptRecordingSummary | null>;
}
