// Cross-context consumer port. Ingestion needs a way to seed a Transcript row when
// an ImportRow is paired with a Recording. The transcription context implements
// this port; ingestion never imports from transcription/ directly.
export interface CreateTranscriptPort {
  create(input: { recordingId: string; originalText: string }): Promise<void>;
}
