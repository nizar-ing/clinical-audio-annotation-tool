export interface TranscriptReadModel {
  correctedText: string;
}

export interface TranscriptReadPort {
  findByRecordingId(recordingId: string): Promise<TranscriptReadModel | null>;
}
