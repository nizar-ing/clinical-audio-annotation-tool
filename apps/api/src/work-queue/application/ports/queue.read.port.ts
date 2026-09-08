import type { RecordingStatus } from '../../../ingestion/domain/value-objects/recording-status.vo.js';
import type { ListQueueQuery } from '../queries/list-queue.query.js';

export interface QueueItem {
  id: string;
  originalFilename: string;
  storageKey: string;
  status: RecordingStatus;
  durationSeconds: number;
  annotator: string;
  werCached: number | null;
  createdAt: Date;
}

export interface QueueReadPort {
  list(query: ListQueueQuery): Promise<{ items: QueueItem[]; total: number }>;
}
