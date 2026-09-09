import type { PrismaClient } from '@prisma/client';
import type { AnnotationAnchoringPort } from '../application/ports/annotation-anchoring.port.js';
import type {
  AnchoredSpanInput,
  AnchoredSpanOutput,
} from '../domain/services/span-anchoring.domain-service.js';

// Talks to the AnnotationSpan table directly rather than importing an adapter from
// the annotation context. Each context owns its own persistence access; the port
// declared in transcription/application/ports names what this side actually needs.
export class PrismaAnnotationAnchoringAdapter implements AnnotationAnchoringPort {
  constructor(private readonly db: PrismaClient) {}

  async findSpansByTranscriptId(transcriptId: string): Promise<AnchoredSpanInput[]> {
    const rows = await this.db.annotationSpan.findMany({
      where: { transcriptId },
      select: { id: true, startOffset: true, endOffset: true, anchorText: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      startOffset: r.startOffset,
      endOffset: r.endOffset,
      anchorText: r.anchorText,
    }));
  }

  async applyReanchor(updates: AnchoredSpanOutput[]): Promise<void> {
    if (updates.length === 0) return;
    await this.db.$transaction(
      updates.map((u) =>
        this.db.annotationSpan.update({
          where: { id: u.id },
          data: {
            startOffset: u.startOffset,
            endOffset: u.endOffset,
            needsReview: u.needsReview,
          },
        }),
      ),
    );
  }
}
