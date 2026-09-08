import { Entity } from '../../../shared/domain/entity.js';
import type { SpanType } from '../value-objects/span-type.vo.js';
import type { SpanOffsets } from '../value-objects/span-offsets.vo.js';

// Loose type: Zod validation happens at the application boundary; the entity trusts validated data.
export type SpanAttributes = { spanType: string; [key: string]: unknown };

export interface AnnotationSpanProps {
  transcriptId: string;
  spanType: SpanType;
  offsets: SpanOffsets;
  anchorText: string;
  attributes: SpanAttributes;
  needsReview: boolean;
  createdAt: Date;
}

export class AnnotationSpan extends Entity<string> {
  private props: AnnotationSpanProps;

  private constructor(id: string, props: AnnotationSpanProps) {
    super(id);
    this.props = { ...props };
  }

  static create(id: string, props: AnnotationSpanProps): AnnotationSpan {
    return new AnnotationSpan(id, props);
  }

  get transcriptId(): string { return this.props.transcriptId; }
  get spanType(): SpanType { return this.props.spanType; }
  get offsets(): SpanOffsets { return this.props.offsets; }
  get anchorText(): string { return this.props.anchorText; }
  get attributes(): SpanAttributes { return this.props.attributes; }
  get needsReview(): boolean { return this.props.needsReview; }
  get createdAt(): Date { return this.props.createdAt; }

  updateOffsets(offsets: SpanOffsets, anchorText: string): void {
    this.props.offsets = offsets;
    this.props.anchorText = anchorText;
    this.props.needsReview = false;
  }

  updateAttributes(attributes: SpanAttributes): void {
    this.props.attributes = attributes;
  }

  flagForReview(): void {
    this.props.needsReview = true;
  }
}
