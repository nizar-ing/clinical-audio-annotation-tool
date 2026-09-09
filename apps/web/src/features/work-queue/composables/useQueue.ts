import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { listQueue } from '../api/queue.api.js';
import type { QueueItem, RecordingStatus } from '../api/queue.api.js';

export type QueueSort = 'duration' | '-duration' | 'createdAt' | '-createdAt';

export interface UseQueueReturn {
  items: Ref<QueueItem[]>;
  total: Ref<number>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  statusFilter: Ref<RecordingStatus[]>;
  sort: Ref<QueueSort>;
  fetchQueue: () => Promise<void>;
  setStatusFilter: (statuses: RecordingStatus[]) => void;
  setSort: (sort: QueueSort) => void;
}

export function useQueue(): UseQueueReturn {
  const items = ref<QueueItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const statusFilter = ref<RecordingStatus[]>(['QUEUED', 'IN_PROGRESS']);
  const sort = ref<QueueSort>('-createdAt');

  async function fetchQueue(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const statusParam = statusFilter.value.join(',');
      const result = await listQueue({ status: statusParam, sort: sort.value });
      items.value = result.data;
      total.value = result.meta.total;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load queue';
    } finally {
      loading.value = false;
    }
  }

  watch([statusFilter, sort], () => { void fetchQueue(); }, { deep: true });

  void fetchQueue();

  return {
    items,
    total,
    loading,
    error,
    statusFilter,
    sort,
    fetchQueue,
    setStatusFilter: (s) => { statusFilter.value = s; },
    setSort: (s) => { sort.value = s; },
  };
}
