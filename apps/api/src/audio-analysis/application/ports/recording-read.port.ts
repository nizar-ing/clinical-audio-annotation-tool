export interface RecordingReadModel {
  id: string;
  storageKey: string;
  mimeType: string;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitDepth: number | null;
  headerMetadata: unknown | null;
}

export interface RecordingReadPort {
  findById(recordingId: string): Promise<RecordingReadModel | null>;
}
