<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Gauge, RadioTower, Info } from 'lucide-vue-next';
import { getConditions, overrideConditions } from '../api/conditions.api.js';
import type { ConditionsDto, DistanceBucket } from '../api/conditions.api.js';

const props = defineProps<{ recordingId: string }>();

const conditions = ref<ConditionsDto | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const saving = ref(false);

const speechRateInput = ref<string>('');
const distanceInput = ref<DistanceBucket | ''>('');

onMounted(() => { void load(); });

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await getConditions(props.recordingId);
    conditions.value = res.data;
    speechRateInput.value = res.data.override.speechRateWpm !== null
      ? String(res.data.override.speechRateWpm)
      : '';
    distanceInput.value = res.data.override.distanceBucket ?? '';
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load conditions';
  } finally {
    loading.value = false;
  }
}

async function saveOverrides() {
  saving.value = true;
  error.value = null;
  try {
    const rate = speechRateInput.value.trim();
    const res = await overrideConditions(props.recordingId, {
      speechRateWpm: rate === '' ? null : Number(rate),
      distanceBucket: distanceInput.value === '' ? null : distanceInput.value,
    });
    conditions.value = res.data;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save overrides';
  } finally {
    saving.value = false;
  }
}

async function clearOverrides() {
  speechRateInput.value = '';
  distanceInput.value = '';
  await saveOverrides();
}
</script>

<template>
  <section class="bg-white rounded-lg border border-warm-200 shadow-sm p-4">
    <div class="flex items-center justify-between mb-3">
      <p class="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 m-0">
        <Gauge
          :size="13"
          :stroke-width="1.75"
        />
        Recording conditions
      </p>
      <span class="font-sans text-xs text-warm-400">Values are estimates</span>
    </div>

    <p
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-1.5 text-xs font-sans m-0 mb-3"
    >
      {{ error }}
    </p>

    <div
      v-if="loading && !conditions"
      class="font-sans text-sm text-warm-400"
    >
      Loading…
    </div>

    <div
      v-if="conditions"
      class="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <!-- Speech rate -->
      <div class="flex flex-col gap-2">
        <div class="flex items-baseline gap-2">
          <span class="font-mono text-2xl font-medium text-warm-900">{{ Math.round(conditions.final.speechRateWpm) }}</span>
          <span class="font-sans text-xs text-warm-500">WPM</span>
          <RadioTower
            :size="12"
            :stroke-width="1.5"
            class="text-warm-400 shrink-0"
          />
        </div>
        <p class="font-sans text-xs text-warm-400 m-0">
          Speech rate · derived {{ Math.round(conditions.derived.speechRateWpm) }}
          <template v-if="conditions.override.speechRateWpm !== null">
            · override {{ Math.round(conditions.override.speechRateWpm) }}
          </template>
        </p>
        <label class="flex flex-col gap-1 mt-1 text-xs font-sans font-semibold uppercase tracking-widest text-warm-500">
          Override WPM
          <input
            v-model="speechRateInput"
            type="number"
            min="0"
            step="1"
            placeholder="—"
            class="font-mono text-sm border border-warm-200 bg-white text-warm-800 rounded-md px-2 py-1 focus:ring-2 focus:ring-sage-300 focus:border-sage-400 outline-none normal-case tracking-normal w-24"
          >
        </label>
      </div>

      <!-- Distance bucket -->
      <div class="flex flex-col gap-2">
        <div class="flex items-baseline gap-2">
          <span class="font-mono text-2xl font-medium text-warm-900 capitalize">{{ conditions.final.distanceBucket }}</span>
        </div>
        <p
          class="flex items-start gap-1 font-sans text-xs text-warm-400 m-0"
          :title="conditions.distanceMethod"
        >
          <Info
            :size="10"
            :stroke-width="1.75"
            class="mt-0.5 shrink-0"
          />
          <span>
            Distance · derived {{ conditions.derived.distanceBucket }}
            <template v-if="conditions.override.distanceBucket !== null">
              · override {{ conditions.override.distanceBucket }}
            </template>
          </span>
        </p>
        <label class="flex flex-col gap-1 mt-1 text-xs font-sans font-semibold uppercase tracking-widest text-warm-500">
          Override distance
          <select
            v-model="distanceInput"
            class="font-sans text-sm border border-warm-200 bg-white text-warm-800 rounded-md px-2 py-1 focus:ring-2 focus:ring-sage-300 focus:border-sage-400 outline-none normal-case tracking-normal w-32"
          >
            <option value="">—</option>
            <option value="close">close</option>
            <option value="normal">normal</option>
            <option value="far">far</option>
          </select>
        </label>
      </div>
    </div>

    <div
      v-if="conditions"
      class="flex justify-end gap-2 mt-3 pt-3 border-t border-warm-100"
    >
      <button
        class="font-sans text-xs text-warm-500 hover:text-warm-800 bg-transparent border-0 cursor-pointer px-3 py-1"
        :disabled="saving"
        @click="clearOverrides"
      >
        Clear overrides
      </button>
      <button
        class="font-sans font-medium text-xs bg-sage-500 hover:bg-sage-600 text-white rounded-md px-3 py-1.5 border-0 cursor-pointer transition-colors disabled:bg-warm-300 disabled:cursor-not-allowed"
        :disabled="saving"
        @click="saveOverrides"
      >
        {{ saving ? 'Saving…' : 'Save overrides' }}
      </button>
    </div>
  </section>
</template>
