import type { RecordingStatus } from '../../../ingestion/domain/value-objects/recording-status.vo.js';

export interface RecordingStatusPort {
  findStatusById(id: string): Promise<{ status: RecordingStatus } | null>;
  updateStatus(id: string, status: RecordingStatus): Promise<void>;
}
