import { Entity } from '../../../shared/domain/entity.js';

export interface ImportRowProps {
  path: string;
  label: string;
  matchedRecordingId: string | null;
  errorCode: string | null;
  createdAt: Date;
}

export class ImportRow extends Entity<string> {
  private props: ImportRowProps;

  private constructor(id: string, props: ImportRowProps) {
    super(id);
    this.props = props;
  }

  static create(id: string, props: ImportRowProps): ImportRow {
    return new ImportRow(id, props);
  }

  get path() { return this.props.path; }
  get label() { return this.props.label; }
  get matchedRecordingId() { return this.props.matchedRecordingId; }
  get errorCode() { return this.props.errorCode; }
  get isMatched() { return this.props.matchedRecordingId !== null; }
}
