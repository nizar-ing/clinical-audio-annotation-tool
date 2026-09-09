<script setup lang="ts">
import type { Component } from 'vue';
import { Upload, Ban, Unlink, Clock, CircleDot, CircleCheck } from 'lucide-vue-next';
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

const badgeIcons: Record<RecordingStatus, Component> = {
  UPLOADED:           Upload,
  REJECTED_TOO_SHORT: Ban,
  UNPAIRED:           Unlink,
  QUEUED:             Clock,
  IN_PROGRESS:        CircleDot,
  DONE:               CircleCheck,
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-sans font-semibold tracking-wide uppercase',
      badgeClasses[props.status],
    ]"
  >
    <component
      :is="badgeIcons[props.status]"
      :size="10"
      :stroke-width="2.5"
      class="shrink-0"
    />
    {{ labels[props.status] }}
  </span>
</template>
