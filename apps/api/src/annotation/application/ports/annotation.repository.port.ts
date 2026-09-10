import type { AnnotationSpan } from '../../domain/entities/annotation-span.entity.js';

export interface AnnotationRepositoryPort {
  findByRecordingId(recordingId: string): Promise<AnnotationSpan[]>;
  findById(id: string): Promise<AnnotationSpan | null>;
  findTranscriptIdByRecordingId(recordingId: string): Promise<string | null>;
  findCorrectedTextByTranscriptId(transcriptId: string): Promise<string | null>;
  save(span: AnnotationSpan): Promise<AnnotationSpan>;
  delete(id: string): Promise<void>;
}
