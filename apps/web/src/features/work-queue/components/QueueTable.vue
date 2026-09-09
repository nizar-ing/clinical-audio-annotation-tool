<script setup lang="ts">
import { useRouter } from 'vue-router';
import Badge from '../../../shared/ui/Badge.vue';
import type { QueueItem } from '../api/queue.api.js';

defineProps<{ items: QueueItem[]; loading: boolean }>();

const router = useRouter();

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatWer(wer: number | null): string {
  return wer !== null ? `${(wer * 100).toFixed(1)} %` : '—';
}
</script>

<template>
  <div class="queue-table-wrap">
    <p
      v-if="loading"
      class="queue-table__loading"
    >
      Loading…
    </p>

    <table
      v-else
      class="queue-table"
    >
      <thead>
        <tr>
          <th>Filename</th>
          <th>Duration</th>
          <th>Status</th>
          <th>WER</th>
          <th>Annotator</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
          class="queue-table__row"
          tabindex="0"
          @click="router.push(`/annotate/${item.id}`)"
          @keydown.enter="router.push(`/annotate/${item.id}`)"
        >
          <td class="queue-table__filename">
            {{ item.originalFilename }}
          </td>
          <td>{{ formatDuration(item.durationSeconds) }}</td>
          <td><Badge :status="item.status" /></td>
          <td>{{ formatWer(item.werCached) }}</td>
          <td>{{ item.annotator || '—' }}</td>
        </tr>
        <tr v-if="items.length === 0">
          <td
            colspan="5"
            class="queue-table__empty"
          >
            No recordings match the current filters.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.queue-table-wrap {
  overflow-x: auto;
}
.queue-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.queue-table th {
  text-align: left;
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
}
.queue-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}
.queue-table__row {
  cursor: pointer;
  transition: background 0.1s;
}
.queue-table__row:hover,
.queue-table__row:focus {
  background: #f9fafb;
  outline: none;
}
.queue-table__filename {
  font-family: monospace;
  font-size: 0.85rem;
}
.queue-table__empty {
  text-align: center;
  padding: 32px;
  color: #9ca3af;
}
.queue-table__loading {
  text-align: center;
  color: #9ca3af;
  padding: 32px;
}
</style>
