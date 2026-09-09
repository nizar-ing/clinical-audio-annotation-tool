<script setup lang="ts">
import { ref } from 'vue';
import type { SpanAttributes } from 'contracts';

const emit = defineEmits<{ submit: [attributes: SpanAttributes]; cancel: [] }>();

const resolvedWord = ref('');

function submit() {
  if (!resolvedWord.value.trim()) return;
  emit('submit', { spanType: 'SPELLED_OUT', resolvedWord: resolvedWord.value.trim() });
}
</script>

<template>
  <form
    class="flex flex-col gap-3"
    @submit.prevent="submit"
  >
    <label class="flex flex-col gap-1 text-xs font-sans font-semibold uppercase tracking-widest text-warm-500">
      Resolved word
      <input
        v-model="resolvedWord"
        type="text"
        placeholder="e.g. Anton → A"
        class="font-mono text-sm border border-warm-200 bg-white text-warm-800 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-sage-300 focus:border-sage-400 outline-none normal-case tracking-normal"
      >
    </label>
    <p class="font-sans text-xs text-warm-400 m-0">
      Automatic alphabet resolution is out of scope; the annotator provides the word.
    </p>
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
