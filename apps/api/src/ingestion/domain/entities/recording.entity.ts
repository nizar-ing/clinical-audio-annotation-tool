import { AggregateRoot } from '../../../shared/domain/aggregate-root.js';
import type { RecordingStatus } from '../value-objects/recording-status.vo.js';
import { assertLegalTransition } from '../value-objects/recording-status.vo.js';

export interface RecordingProps {
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitDepth: number | null;
  headerMetadata: Record<string, unknown> | null;
  status: RecordingStatus;
  annotator: string;
  createdAt: Date;
}

export class Recording extends AggregateRoot<string> {
  private props: RecordingProps;

  private constructor(id: string, props: RecordingProps) {
    super(id);
    this.props = props;
  }

  static create(id: string, props: RecordingProps): Recording {
    return new Recording(id, props);
  }

  get originalFilename() { return this.props.originalFilename; }
  get storageKey() { return this.props.storageKey; }
  get mimeType() { return this.props.mimeType; }
  get sizeBytes() { return this.props.sizeBytes; }
  get durationSeconds() { return this.props.durationSeconds; }
  get sampleRate() { return this.props.sampleRate; }
  get channels() { return this.props.channels; }
  get bitDepth() { return this.props.bitDepth; }
  get headerMetadata() { return this.props.headerMetadata; }
  get status() { return this.props.status; }
  get annotator() { return this.props.annotator; }
  get createdAt() { return this.props.createdAt; }

  transitionTo(next: RecordingStatus): void {
    assertLegalTransition(this.props.status, next);
    this.props.status = next;
  }
}
