<script setup lang="ts">
import type { RecordingStatus } from '../../features/work-queue/api/queue.api.js';

const props = defineProps<{ status: RecordingStatus }>();

const labels: Record<RecordingStatus, string> = {
  UPLOADED: 'Uploaded',
  REJECTED_TOO_SHORT: 'Rejected',
  UNPAIRED: 'Unpaired',
  QUEUED: 'Queued',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const badgeClasses: Record<RecordingStatus, string> = {
  UPLOADED:           'bg-clin-100 text-clin-700',
  REJECTED_TOO_SHORT: 'bg-red-100 text-red-700',
  UNPAIRED:           'bg-harvest-100 text-harvest-600',
  QUEUED:             'bg-sage-100 text-sage-700',
  IN_PROGRESS:        'bg-harvest-200 text-harvest-600',
  DONE:               'bg-sage-200 text-sage-800',
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-sans font-semibold tracking-wide uppercase',
      badgeClasses[props.status],
    ]"
  >
    {{ labels[props.status] }}
  </span>
</template>
