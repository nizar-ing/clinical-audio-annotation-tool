import type { RecordingStatus } from '../../../../ingestion/domain/value-objects/recording-status.vo.js';

export interface UpdateStatusCommand {
  recordingId: string;
  next: RecordingStatus;
}
