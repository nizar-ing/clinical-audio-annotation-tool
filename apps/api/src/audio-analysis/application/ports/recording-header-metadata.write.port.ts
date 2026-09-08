// Separated from RecordingReadPort so the cross-context write is explicit and isolated.
// Only used by AnalyzeRecordingHandler when a WAV's Recording.headerMetadata is null on first analysis.
export interface RecordingHeaderMetadataWritePort {
  update(recordingId: string, headerMetadata: unknown): Promise<void>;
}
