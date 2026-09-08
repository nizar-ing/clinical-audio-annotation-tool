import { randomUUID } from 'crypto';
import { SpanAttributesSchema } from 'contracts';
import { DomainException } from '../../../../shared/domain/exceptions/domain.exception.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import { AnnotationSpan } from '../../../domain/entities/annotation-span.entity.js';
import { SpanOffsets } from '../../../domain/value-objects/span-offsets.vo.js';
import type { SpanType } from '../../../domain/value-objects/span-type.vo.js';
import { SPAN_TYPES } from '../../../domain/value-objects/span-type.vo.js';
import { UnitNormalizationDomainService } from '../../../domain/services/unit-normalization.domain-service.js';
import type { AnnotationRepositoryPort } from '../../ports/annotation.repository.port.js';
import type { CreateSpanCommand } from './create-span.command.js';

export class CreateSpanHandler {
  constructor(private readonly annotations: AnnotationRepositoryPort) {}

  async execute(cmd: CreateSpanCommand): Promise<AnnotationSpan> {
    if (!SPAN_TYPES.includes(cmd.spanType as SpanType)) {
      throw new DomainException(`Unknown span type: ${cmd.spanType}`);
    }

    const transcriptId = await this.annotations.findTranscriptIdByRecordingId(cmd.recordingId);
    if (!transcriptId) {
      throw new NotFoundException(`No transcript found for recording ${cmd.recordingId}`);
    }

    const parsed = SpanAttributesSchema.safeParse(cmd.attributes);
    if (!parsed.success) {
      throw new DomainException(
        `Invalid attributes for spanType ${cmd.spanType}: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      );
    }

    let attributes = parsed.data;

    if (attributes.spanType === 'MEASUREMENT') {
      const normalized = UnitNormalizationDomainService.normalize(attributes.value, attributes.unit);
      if (normalized) {
        attributes = { ...attributes, normalizedValue: normalized.value, normalizedUnit: normalized.unit };
      }
    }

    const offsets = SpanOffsets.create(cmd.startOffset, cmd.endOffset, cmd.anchorText.length);

    const span = AnnotationSpan.create(randomUUID(), {
      transcriptId,
      spanType: cmd.spanType as SpanType,
      offsets,
      anchorText: cmd.anchorText,
      attributes,
      needsReview: false,
      createdAt: new Date(),
    });

    return this.annotations.save(span);
  }
}
