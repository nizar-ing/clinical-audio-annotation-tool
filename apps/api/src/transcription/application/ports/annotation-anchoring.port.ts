import type { AnchoredSpanInput, AnchoredSpanOutput } from '../../domain/services/span-anchoring.domain-service.js';

// Cross-context consumer port. The transcription use case for updating corrected
// text reaches into annotations to re-anchor spans onto the new text. The port
// stays here so the transcription layer is the one that names its collaborators;
// the adapter that satisfies it lives in transcription/infrastructure and talks
// to Prisma directly rather than importing from annotation/.
export interface AnnotationAnchoringPort {
  findSpansByTranscriptId(transcriptId: string): Promise<AnchoredSpanInput[]>;
  applyReanchor(updates: AnchoredSpanOutput[]): Promise<void>;
}
