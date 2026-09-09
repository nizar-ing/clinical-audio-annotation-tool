<script setup lang="ts">
import type { RecordingStatus } from '../api/queue.api.js';
import type { QueueSort } from '../composables/useQueue.js';

const props = defineProps<{
  statusFilter: RecordingStatus[];
  sort: QueueSort;
}>();

const emit = defineEmits<{
  'update:statusFilter': [value: RecordingStatus[]];
  'update:sort': [value: QueueSort];
}>();

const ALL_STATUSES: RecordingStatus[] = ['QUEUED', 'IN_PROGRESS', 'DONE', 'UNPAIRED', 'REJECTED_TOO_SHORT'];
const STATUS_LABELS: Record<RecordingStatus, string> = {
  UPLOADED: 'Uploaded',
  REJECTED_TOO_SHORT: 'Rejected',
  UNPAIRED: 'Unpaired',
  QUEUED: 'Queued',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const SORT_OPTIONS: { value: QueueSort; label: string }[] = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt',  label: 'Oldest first' },
  { value: '-duration',  label: 'Longest first' },
  { value: 'duration',   label: 'Shortest first' },
];

function toggleStatus(status: RecordingStatus) {
  const next = props.statusFilter.includes(status)
    ? props.statusFilter.filter((s) => s !== status)
    : [...props.statusFilter, status];
  emit('update:statusFilter', next);
}
</script>

<template>
  <div class="queue-filters">
    <div class="queue-filters__group">
      <span class="queue-filters__label">Status</span>
      <label
        v-for="status in ALL_STATUSES"
        :key="status"
        class="queue-filters__checkbox"
      >
        <input
          type="checkbox"
          :checked="props.statusFilter.includes(status)"
          @change="toggleStatus(status)"
        >
        {{ STATUS_LABELS[status] }}
      </label>
    </div>

    <div class="queue-filters__group">
      <label
        class="queue-filters__label"
        for="queue-sort"
      >Sort</label>
      <select
        id="queue-sort"
        :value="props.sort"
        @change="emit('update:sort', ($event.target as HTMLSelectElement).value as QueueSort)"
      >
        <option
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.queue-filters {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}
.queue-filters__group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.queue-filters__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 4px;
}
.queue-filters__checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}
select {
  font-size: 0.875rem;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
}
</style>
