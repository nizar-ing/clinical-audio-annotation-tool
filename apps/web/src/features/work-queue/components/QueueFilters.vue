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
  <div class="flex flex-wrap gap-3 sm:gap-6 items-center py-4 border-b border-warm-200 mb-4">
    <div class="flex items-center gap-3 flex-wrap">
      <span class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 mr-1">Status</span>
      <label
        v-for="status in ALL_STATUSES"
        :key="status"
        class="flex items-center gap-1.5 font-sans text-sm text-warm-700 cursor-pointer"
      >
        <input
          type="checkbox"
          :checked="props.statusFilter.includes(status)"
          class="accent-sage-500 cursor-pointer"
          @change="toggleStatus(status)"
        >
        {{ STATUS_LABELS[status] }}
      </label>
    </div>

    <div class="flex items-center gap-2">
      <label
        class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400"
        for="queue-sort"
      >Sort</label>
      <select
        id="queue-sort"
        :value="props.sort"
        class="font-sans text-sm border border-warm-200 rounded-md px-2 py-1 bg-white text-warm-700 focus:ring-2 focus:ring-sage-300 focus:border-sage-400 outline-none cursor-pointer"
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
