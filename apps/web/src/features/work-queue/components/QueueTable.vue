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
  <div class="overflow-x-auto">
    <p
      v-if="loading"
      class="text-center text-warm-400 font-sans text-sm py-16"
    >
      Loading…
    </p>

    <table
      v-else
      class="w-full border-collapse"
    >
      <thead>
        <tr>
          <th class="text-left px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 border-b-2 border-warm-200">
            Filename
          </th>
          <th class="text-left px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 border-b-2 border-warm-200">
            Duration
          </th>
          <th class="text-left px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 border-b-2 border-warm-200">
            Status
          </th>
          <th class="text-left px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 border-b-2 border-warm-200">
            WER
          </th>
          <th class="text-left px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 border-b-2 border-warm-200">
            Annotator
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-warm-100 hover:bg-sage-50 focus:bg-sage-50 cursor-pointer transition-colors duration-150 focus:outline-none"
          tabindex="0"
          @click="router.push(`/annotate/${item.id}`)"
          @keydown.enter="router.push(`/annotate/${item.id}`)"
        >
          <td class="px-4 py-3 align-middle font-mono text-sm text-warm-800">
            {{ item.originalFilename }}
          </td>
          <td class="px-4 py-3 align-middle font-mono text-sm text-warm-600">
            {{ formatDuration(item.durationSeconds) }}
          </td>
          <td class="px-4 py-3 align-middle">
            <Badge :status="item.status" />
          </td>
          <td class="px-4 py-3 align-middle font-mono text-sm text-warm-600">
            {{ formatWer(item.werCached) }}
          </td>
          <td class="px-4 py-3 align-middle font-sans text-sm text-warm-400">
            {{ item.annotator || '—' }}
          </td>
        </tr>
        <tr v-if="items.length === 0">
          <td
            colspan="5"
            class="text-center py-16 text-warm-400 font-sans text-sm"
          >
            No recordings match the current filters.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
