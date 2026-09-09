<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SpanAttributes } from 'contracts';

const emit = defineEmits<{ submit: [attributes: SpanAttributes]; cancel: [] }>();

const UNITS = ['g', 'mg', 'ug', 'kg', 'ml', 'l', 'mm', 'cm', 'Ch', 'mmHg', 'IE'] as const;
type Unit = (typeof UNITS)[number];
const NON_CONVERTED: Unit[] = ['mmHg', 'IE'];

const value = ref<number>(0);
const unit = ref<Unit>('mg');

// Live preview of the same normalisation the server applies. Kept for
// annotator clarity; the server is the source of truth.
const preview = computed(() => {
  const v = value.value;
  if (NON_CONVERTED.includes(unit.value)) return 'not converted';
  switch (unit.value) {
    case 'g':  return `${v} g`;
    case 'mg': return `${v / 1000} g`;
    case 'ug': return `${v / 1_000_000} g`;
    case 'kg': return `${v * 1000} g`;
    case 'ml': return `${v} ml`;
    case 'l':  return `${v * 1000} ml`;
    case 'mm': return `${v} mm`;
    case 'cm': return `${v * 10} mm`;
    case 'Ch': return `${(v / 3).toFixed(3)} mm`;
    default:   return '';
  }
});

function submit() {
  emit('submit', {
    spanType: 'MEASUREMENT',
    value: value.value,
    unit: unit.value,
  });
}
</script>

<template>
  <form
    class="flex flex-col gap-3"
    @submit.prevent="submit"
  >
    <div class="grid grid-cols-2 gap-3">
      <label class="flex flex-col gap-1 text-xs font-sans font-semibold uppercase tracking-widest text-warm-500">
        Value
        <input
          v-model.number="value"
          type="number"
          step="any"
          class="font-mono text-sm border border-warm-200 bg-white text-warm-800 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-sage-300 focus:border-sage-400 outline-none normal-case tracking-normal"
        >
      </label>
      <label class="flex flex-col gap-1 text-xs font-sans font-semibold uppercase tracking-widest text-warm-500">
        Unit
        <select
          v-model="unit"
          class="font-mono text-sm border border-warm-200 bg-white text-warm-800 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-sage-300 focus:border-sage-400 outline-none normal-case tracking-normal"
        >
          <option
            v-for="u in UNITS"
            :key="u"
            :value="u"
          >
            {{ u }}
          </option>
        </select>
      </label>
    </div>
    <p class="font-mono text-xs text-clin-600 m-0">
      Normalised: {{ preview }}
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
