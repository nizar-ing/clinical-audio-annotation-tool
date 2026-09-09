<script setup lang="ts">
import { useQueue } from '../composables/useQueue.js';
import QueueFilters from './QueueFilters.vue';
import QueueTable from './QueueTable.vue';

const { items, total, loading, error, statusFilter, sort, setStatusFilter, setSort } = useQueue();
</script>

<template>
  <main class="queue-page">
    <div class="queue-page__header">
      <h1 class="queue-page__title">
        Annotation Queue
      </h1>
      <span
        v-if="!loading"
        class="queue-page__count"
      >
        {{ total }} item{{ total !== 1 ? 's' : '' }}
      </span>
    </div>

    <p
      v-if="error"
      class="queue-page__error"
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

<style scoped>
.queue-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
}
.queue-page__header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}
.queue-page__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}
.queue-page__count {
  font-size: 0.875rem;
  color: #6b7280;
}
.queue-page__error {
  color: #dc2626;
  background: #fee2e2;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.875rem;
  margin-bottom: 12px;
}
</style>
