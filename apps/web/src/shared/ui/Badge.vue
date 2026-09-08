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
</script>

<template>
  <span :class="['badge', `badge--${props.status.toLowerCase().replace(/_/g, '-')}`]">
    {{ labels[props.status] }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* Colourblind-safe palette: hue + lightness contrast, not hue alone */
.badge--uploaded        { background: #e0e7ff; color: #3730a3; }
.badge--rejected-too-short { background: #fee2e2; color: #991b1b; }
.badge--unpaired        { background: #fef3c7; color: #92400e; }
.badge--queued          { background: #dbeafe; color: #1e40af; }
.badge--in-progress     { background: #fef9c3; color: #78350f; }
.badge--done            { background: #dcfce7; color: #166534; }
</style>
