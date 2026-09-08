import { ValueObject } from '../../../shared/domain/value-object.js';
import { InvalidSpanException } from '../exceptions/invalid-span.exception.js';

export class SpanOffsets extends ValueObject<{ start: number; end: number }> {
  private constructor(props: { start: number; end: number }) {
    super(props);
  }

  static create(start: number, end: number, textLength: number): SpanOffsets {
    if (start < 0 || end <= start || end > textLength) {
      throw new InvalidSpanException(
        `Invalid offsets [${start},${end}) for text of length ${textLength}`,
      );
    }
    return new SpanOffsets({ start, end });
  }

  // Reconstruct from persisted data without re-running the invariant check.
  static fromPersisted(start: number, end: number): SpanOffsets {
    return new SpanOffsets({ start, end });
  }

  get start(): number {
    return this.props.start;
  }
  get end(): number {
    return this.props.end;
  }
}
