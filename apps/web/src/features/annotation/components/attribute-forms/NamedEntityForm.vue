<script setup lang="ts">
import { ref } from 'vue';
import type { SpanAttributes } from 'contracts';

const emit = defineEmits<{ submit: [attributes: SpanAttributes]; cancel: [] }>();

const entityType = ref<'person' | 'place' | 'organization' | 'date' | 'time' | 'other'>('person');

function submit() {
  emit('submit', { spanType: 'NAMED_ENTITY', entityType: entityType.value });
}
</script>

<template>
  <form
    class="flex flex-col gap-3"
    @submit.prevent="submit"
  >
    <label class="flex flex-col gap-1 text-xs font-sans font-semibold uppercase tracking-widest text-warm-500">
      Entity type
      <select
        v-model="entityType"
        class="font-sans text-sm border border-warm-200 bg-white text-warm-800 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-sage-300 focus:border-sage-400 outline-none normal-case tracking-normal"
      >
        <option value="person">Person</option>
        <option value="place">Place</option>
        <option value="organization">Organization</option>
        <option value="date">Date</option>
        <option value="time">Time</option>
        <option value="other">Other</option>
      </select>
    </label>
    <div class="flex justify-end gap-2 pt-2 border-t border-warm-100">
      <button
        type="button"
        class="font-sans text-sm text-warm-500 hover:text-warm-800 bg-transparent border-0 cursor-pointer px-3 py-1"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="font-sans font-medium text-sm bg-sage-500 hover:bg-sage-600 text-white rounded-lg px-4 py-1.5 border-0 cursor-pointer transition-colors"
      >
        Save span
      </button>
    </div>
  </form>
</template>
