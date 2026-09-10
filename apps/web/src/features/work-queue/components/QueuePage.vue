<script setup lang="ts">
import { ListChecks } from 'lucide-vue-next';
import { useQueue } from '../composables/useQueue.js';
import QueueFilters from './QueueFilters.vue';
import QueueTable from './QueueTable.vue';

const { items, total, loading, error, statusFilter, sort, setStatusFilter, setSort } = useQueue();
</script>

<template>
  <main class="card-container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-8 sm:mt-20 lg:mt-36 mb-8">
    <div class="flex items-center gap-3 mb-5">
      <ListChecks
        :size="22"
        :stroke-width="1.5"
        class="text-sage-600 shrink-0"
      />
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
