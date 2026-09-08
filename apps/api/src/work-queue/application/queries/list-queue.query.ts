import type { RecordingStatus } from '../../../ingestion/domain/value-objects/recording-status.vo.js';

export type QueueSort = 'duration' | '-duration' | 'createdAt' | '-createdAt';

export const QUEUE_SORTS: readonly QueueSort[] = ['duration', '-duration', 'createdAt', '-createdAt'];

export interface ListQueueQuery {
  statuses: RecordingStatus[];
  minDuration?: number;
  maxDuration?: number;
  sort: QueueSort;
  limit: number;
  offset: number;
}
