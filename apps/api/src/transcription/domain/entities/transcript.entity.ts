import { Entity } from '../../../shared/domain/entity.js';
import type { AlignmentMethod, WordAlignment } from '../value-objects/word-alignment.vo.js';

export interface TranscriptProps {
  recordingId: string;
  originalText: string;
  correctedText: string;
  wordTimings: WordAlignment[] | null;
  alignmentMethod: AlignmentMethod;
  werCached: number;
  updatedAt: Date;
}

// The gold-standard invariant lives here at the domain level: originalText is set
// once, at construction, and there is no setter. A database trigger enforces the
// same rule as a second line of defense (see the initial migration).
export class Transcript extends Entity<string> {
  private props: TranscriptProps;

  private constructor(id: string, props: TranscriptProps) {
    super(id);
    this.props = { ...props };
  }

  static create(id: string, props: TranscriptProps): Transcript {
    return new Transcript(id, props);
  }

  get recordingId(): string { return this.props.recordingId; }
  get originalText(): string { return this.props.originalText; }
  get correctedText(): string { return this.props.correctedText; }
  get wordTimings(): WordAlignment[] | null { return this.props.wordTimings; }
  get alignmentMethod(): AlignmentMethod { return this.props.alignmentMethod; }
  get werCached(): number { return this.props.werCached; }
  get updatedAt(): Date { return this.props.updatedAt; }

  updateCorrected(text: string, werCached: number): void {
    this.props.correctedText = text;
    this.props.werCached = werCached;
    this.props.updatedAt = new Date();
  }

  updateAlignment(wordTimings: WordAlignment[], method: AlignmentMethod): void {
    this.props.wordTimings = wordTimings;
    this.props.alignmentMethod = method;
  }
}
