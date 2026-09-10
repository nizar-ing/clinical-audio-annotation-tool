<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';
import type { WordTiming, AlignmentMethod } from '../api/transcript.api.js';
import type { SpanDto } from '../../annotation/api/annotation.api.js';
import { useSpanSelection } from '../composables/useSpanSelection.js';
import type { TextSelection } from '../composables/useSpanSelection.js';
import { tokenDiff } from '../lib/token-diff.js';

const props = defineProps<{
  originalText: string;
  correctedText: string;
  wordTimings: WordTiming[] | null;
  alignmentMethod: AlignmentMethod;
  spans: SpanDto[];
  saving: boolean;
  lastSavedAt: Date | null;
}>();

const emit = defineEmits<{
  'update:corrected': [text: string];
  'word-click': [time: number];
  'selection': [selection: TextSelection];
  'selection-cleared': [];
}>();

const correctedEl = ref<HTMLDivElement | null>(null);
const { current: selection } = useSpanSelection(correctedEl);

watch(selection, (s) => {
  if (s) emit('selection', s);
  else emit('selection-cleared');
});

// The corrected pane is contenteditable and one-way-bound so we don't fight the caret.
// We only mirror props.correctedText into the DOM when it changed externally
// (e.g. after a load, or a re-anchor that reset). The internal ref tracks what the
// annotator last typed to detect divergence.
const lastMirrored = ref(props.correctedText);

onMounted(() => {
  if (correctedEl.value) {
    correctedEl.value.innerText = props.correctedText;
  }
});
watch(
  () => props.correctedText,
  async (val) => {
    if (val === lastMirrored.value) return;
    await nextTick();
    if (correctedEl.value && correctedEl.value.innerText !== val) {
      correctedEl.value.innerText = val;
    }
    lastMirrored.value = val;
  },
  { immediate: false },
);

function onInput(event: Event) {
  const text = (event.target as HTMLElement).innerText;
  lastMirrored.value = text;
  emit('update:corrected', text);
}

const diffSegments = computed(() => tokenDiff(props.originalText, props.correctedText));

const reviewSpans = computed(() => props.spans.filter((s) => s.needsReview));

function formatSavedAt(date: Date | null): string {
  if (!date) return '';
  const secs = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}
</script>

<template>
  <section class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 overflow-x-hidden">
    <!-- Original pane (immutable) -->
    <div class="bg-white rounded-lg border border-warm-200 shadow-sm p-4 min-h-40">
      <div class="flex items-center justify-between mb-3">
        <p class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 m-0">
          Original AI transcript
        </p>
        <span
          class="font-sans text-xs text-warm-400"
          :title="`alignment method: ${alignmentMethod}`"
        >
          Est. alignment · {{ alignmentMethod }}
        </span>
      </div>
      <p class="font-sans text-sm text-warm-700 m-0 leading-relaxed break-words">
        <template v-if="wordTimings && wordTimings.length > 0">
          <span
            v-for="(w, i) in wordTimings"
            :key="`${w.w}-${i}`"
            class="cursor-pointer hover:bg-clin-50 hover:text-clin-700 rounded px-0.5 transition-colors mr-1"
            :title="`Seek to ${w.start.toFixed(2)}s`"
            @click="emit('word-click', w.start)"
          >
            {{ w.w }}
          </span>
        </template>
        <template v-else>
          {{ originalText }}
        </template>
      </p>
    </div>

    <!-- Corrected pane (editable) -->
    <div class="bg-white rounded-lg border border-sage-200 shadow-sm p-4 min-h-40">
      <div class="flex items-center justify-between mb-3">
        <p class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 m-0">
          Corrected transcript
        </p>
        <span class="font-sans text-xs text-sage-600">
          <template v-if="saving">Saving…</template>
          <template v-else-if="lastSavedAt">Saved · {{ formatSavedAt(lastSavedAt) }}</template>
          <template v-else>Auto-saves as you type</template>
        </span>
      </div>
      <div
        ref="correctedEl"
        contenteditable="plaintext-only"
        dir="ltr"
        class="font-sans text-sm text-warm-900 leading-relaxed outline-none focus:ring-2 focus:ring-sage-200 rounded p-1 -m-1 min-h-32 whitespace-pre-wrap break-words"
        role="textbox"
        aria-multiline="true"
        spellcheck="false"
        @input="onInput"
      />
    </div>

    <!-- Diff + review sidebar spans the row below -->
    <div class="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-4">
      <div class="flex-1 bg-warm-50 rounded-lg border border-warm-100 p-3">
        <p class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 m-0 mb-2">
          Changes
        </p>
        <p class="font-sans text-sm m-0 leading-relaxed">
          <span
            v-for="(seg, i) in diffSegments"
            :key="i"
            class="mr-1 inline-block"
            :class="{
              'text-warm-500': seg.kind === 'equal',
              'bg-harvest-100 text-harvest-700 rounded px-1': seg.kind === 'inserted',
              'line-through text-warm-300': seg.kind === 'deleted',
            }"
          >
            {{ seg.token }}
          </span>
          <span
            v-if="diffSegments.length === 0"
            class="text-warm-400"
          >
            No changes yet.
          </span>
        </p>
      </div>

      <div
        v-if="reviewSpans.length > 0"
        class="w-full md:w-64 bg-red-50 border border-red-200 rounded-lg p-3"
      >
        <p class="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-widest text-red-700 m-0 mb-2">
          <AlertTriangle
            :size="13"
            :stroke-width="2"
          />
          Needs review · {{ reviewSpans.length }}
        </p>
        <ul class="list-none p-0 m-0 space-y-1">
          <li
            v-for="s in reviewSpans"
            :key="s.id"
            class="font-mono text-xs text-red-700"
          >
            "{{ s.anchorText }}" · {{ s.spanType }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
