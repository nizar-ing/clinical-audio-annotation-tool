<script setup lang="ts">
import { useQueue } from '../composables/useQueue.js';
import QueueFilters from './QueueFilters.vue';
import QueueTable from './QueueTable.vue';

const { items, total, loading, error, statusFilter, sort, setStatusFilter, setSort } = useQueue();
</script>

<template>
  <main class="max-w-5xl mx-auto px-6 py-8">
    <div class="flex items-baseline gap-3 mb-5">
      <h1 class="font-display text-2xl font-semibold text-warm-900 m-0">
        Annotation Queue
      </h1>
      <span
        v-if="!loading"
        class="font-sans text-sm text-warm-400"
      >
        {{ total }} item{{ total !== 1 ? 's' : '' }}
      </span>
    </div>

    <p
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-sans mb-4"
    >
      {{ error }}
    </p>

    <QueueFilters
      :status-filter="statusFilter"
      :sort="sort"
      @update:status-filter="setStatusFilter"
      @update:sort="setSort"
    />

    <QueueTable
      :items="items"
      :loading="loading"
    />
  </main>
</template>
