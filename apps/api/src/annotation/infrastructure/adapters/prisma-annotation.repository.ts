import type { AnnotationSpan as PrismaSpan, PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { SpanAttributesSchema } from 'contracts';
import { AnnotationSpan } from '../../domain/entities/annotation-span.entity.js';
import type { SpanAttributes } from '../../domain/entities/annotation-span.entity.js';
import { SpanOffsets } from '../../domain/value-objects/span-offsets.vo.js';
import type { SpanType } from '../../domain/value-objects/span-type.vo.js';
import type { AnnotationRepositoryPort } from '../../application/ports/annotation.repository.port.js';

export class PrismaAnnotationRepository implements AnnotationRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async findByRecordingId(recordingId: string): Promise<AnnotationSpan[]> {
    const transcript = await this.db.transcript.findUnique({ where: { recordingId } });
    if (!transcript) return [];
    const rows = await this.db.annotationSpan.findMany({
      where: { transcriptId: transcript.id },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<AnnotationSpan | null> {
    const row = await this.db.annotationSpan.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findTranscriptIdByRecordingId(recordingId: string): Promise<string | null> {
    const transcript = await this.db.transcript.findUnique({ where: { recordingId } });
    return transcript ? transcript.id : null;
  }

  async findCorrectedTextByTranscriptId(transcriptId: string): Promise<string | null> {
    const transcript = await this.db.transcript.findUnique({
      where: { id: transcriptId },
      select: { correctedText: true },
    });
    return transcript ? transcript.correctedText : null;
  }

  async save(span: AnnotationSpan): Promise<AnnotationSpan> {
    const row = await this.db.annotationSpan.upsert({
      where: { id: span.id },
      create: {
        id: span.id,
        transcriptId: span.transcriptId,
        spanType: span.spanType,
        startOffset: span.offsets.start,
        endOffset: span.offsets.end,
        anchorText: span.anchorText,
        attributes: span.attributes as unknown as Prisma.InputJsonValue,
        needsReview: span.needsReview,
        createdAt: span.createdAt,
      },
      update: {
        spanType: span.spanType,
        startOffset: span.offsets.start,
        endOffset: span.offsets.end,
        anchorText: span.anchorText,
        attributes: span.attributes as unknown as Prisma.InputJsonValue,
        needsReview: span.needsReview,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.annotationSpan.delete({ where: { id } });
  }

  private toEntity(row: PrismaSpan): AnnotationSpan {
    const parsed = SpanAttributesSchema.safeParse(row.attributes);
    const attributes: SpanAttributes = parsed.success
      ? parsed.data
      : { spanType: row.spanType, ...(row.attributes as Record<string, unknown>) };
    const needsReview = !parsed.success || row.needsReview;

    return AnnotationSpan.create(row.id, {
      transcriptId: row.transcriptId,
      spanType: row.spanType as SpanType,
      offsets: SpanOffsets.fromPersisted(row.startOffset, row.endOffset),
      anchorText: row.anchorText,
      attributes,
      needsReview,
      createdAt: row.createdAt,
    });
  }
}
