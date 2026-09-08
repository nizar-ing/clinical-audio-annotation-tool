import { SpanAttributesSchema } from 'contracts';
import { DomainException } from '../../../../shared/domain/exceptions/domain.exception.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import { SpanOffsets } from '../../../domain/value-objects/span-offsets.vo.js';
import { UnitNormalizationDomainService } from '../../../domain/services/unit-normalization.domain-service.js';
import type { AnnotationRepositoryPort } from '../../ports/annotation.repository.port.js';
import type { AnnotationSpan } from '../../../domain/entities/annotation-span.entity.js';
import type { UpdateSpanCommand } from './update-span.command.js';

export class UpdateSpanHandler {
  constructor(private readonly annotations: AnnotationRepositoryPort) {}

  async execute(cmd: UpdateSpanCommand): Promise<AnnotationSpan> {
    const span = await this.annotations.findById(cmd.id);
    if (!span) throw new NotFoundException(`Annotation span ${cmd.id} not found`);

    if (cmd.startOffset !== undefined || cmd.endOffset !== undefined) {
      const start = cmd.startOffset ?? span.offsets.start;
      const end = cmd.endOffset ?? span.offsets.end;
      const anchor = cmd.anchorText ?? span.anchorText;
      const offsets = SpanOffsets.create(start, end, anchor.length);
      span.updateOffsets(offsets, anchor);
    }

    if (cmd.attributes !== undefined) {
      const parsed = SpanAttributesSchema.safeParse(cmd.attributes);
      if (!parsed.success) {
        throw new DomainException(
          `Invalid attributes: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
        );
      }

      let attributes = parsed.data;

      if (attributes.spanType === 'MEASUREMENT') {
        const normalized = UnitNormalizationDomainService.normalize(attributes.value, attributes.unit);
        if (normalized) {
          attributes = { ...attributes, normalizedValue: normalized.value, normalizedUnit: normalized.unit };
        }
      }

      span.updateAttributes(attributes);
    }

    return this.annotations.save(span);
  }
}
