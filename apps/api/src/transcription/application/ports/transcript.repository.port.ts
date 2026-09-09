import type { Transcript } from '../../domain/entities/transcript.entity.js';

export interface TranscriptRepositoryPort {
  findByRecordingId(recordingId: string): Promise<Transcript | null>;
  save(transcript: Transcript): Promise<Transcript>;
}
