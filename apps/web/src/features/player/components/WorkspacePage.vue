<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, FileAudio, Clock, Activity, Headphones } from 'lucide-vue-next';
import AudioPlayer from './AudioPlayer.vue';
import Badge from '../../../shared/ui/Badge.vue';
import TranscriptView from '../../transcript-editor/components/TranscriptView.vue';
import SpanPopover from '../../annotation/components/SpanPopover.vue';
import ConditionsPanel from '../../recording-conditions/components/ConditionsPanel.vue';
import { useTranscriptEdit } from '../../transcript-editor/composables/useTranscriptEdit.js';
import type { TextSelection } from '../../transcript-editor/composables/useSpanSelection.js';
import { listSpans, createSpan } from '../../annotation/api/annotation.api.js';
import type { SpanDto } from '../../annotation/api/annotation.api.js';
import type { SpanAttributes } from 'contracts';
import { getRecording, updateQueueStatus, listQueue } from '../../work-queue/api/queue.api.js';
import type { QueueItem, RecordingStatus } from '../../work-queue/api/queue.api.js';

const props = defineProps<{ id: string }>();
const router = useRouter();

type FullRecording = QueueItem & {
  mimeType: string;
  sizeBytes: number;
  sampleRate: number;
  channels: number;
  bitDepth: number | null;
  headerMetadata: Record<string, unknown> | null;
};

const recording = ref<FullRecording | null>(null);
const loadError = ref<string | null>(null);
const statusError = ref<string | null>(null);
const completing = ref(false);

const audioUrl = computed(() =>
  recording.value ? `/uploads/${recording.value.storageKey}` : '',
);

const audioPlayerRef = ref<InstanceType<typeof AudioPlayer> | null>(null);
function seekAudio(time: number) {
  audioPlayerRef.value?.seek(time);
}

const editor = useTranscriptEdit();
const spans = ref<SpanDto[]>([]);
const currentSelection = ref<TextSelection | null>(null);
// Preserve the last non-null selection so onSubmitSpan can access offsets even
// after the correctedEl selection is cleared by focusing a form input.
const selectionSnapshot = ref<TextSelection | null>(null);
const spansError = ref<string | null>(null);

watch(currentSelection, (sel) => {
  if (sel !== null) selectionSnapshot.value = sel;
});

async function reloadSpans() {
  try {
    const res = await listSpans(props.id);
    spans.value = res.data;
  } catch (e) {
    spansError.value = e instanceof Error ? e.message : 'Failed to load spans';
  }
}

onMounted(async () => {
  try {
    const res = await getRecording(props.id);
    recording.value = res.data as FullRecording;

    if (recording.value.status === 'QUEUED') {
      const updated = await updateQueueStatus(props.id, 'IN_PROGRESS');
      recording.value = { ...recording.value, status: updated.data.status };
    }

    await Promise.all([editor.load(props.id), reloadSpans()]);
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Failed to load recording';
  }
});

function clearSelection() {
  currentSelection.value = null;
  selectionSnapshot.value = null;
  window.getSelection()?.removeAllRanges();
}

async function onSubmitSpan(attributes: SpanAttributes) {
  const sel = selectionSnapshot.value;
  if (!sel) return;
  try {
    await createSpan(props.id, {
      spanType: attributes.spanType,
      startOffset: sel.startOffset,
      endOffset: sel.endOffset,
      anchorText: sel.anchorText,
      attributes,
    });
    clearSelection();
    await reloadSpans();
  } catch (e) {
    spansError.value = e instanceof Error ? e.message : 'Failed to save span';
  }
}

async function markCompleteAndNext() {
  if (!recording.value) return;
  completing.value = true;
  statusError.value = null;
  try {
    await editor.saveNow();
    await updateQueueStatus(props.id, 'DONE');
    // Find the next QUEUED recording after this one; falls back to the queue index.
    const queue = await listQueue({ status: 'QUEUED', sort: 'oldest', limit: 1 });
    if (queue.data.length > 0 && queue.data[0]!.id !== props.id) {
      router.push(`/annotate/${queue.data[0]!.id}`);
    } else {
      router.push('/queue');
    }
  } catch (e) {
    statusError.value = e instanceof Error ? e.message : 'Failed to update status';
    completing.value = false;
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const werPercent = computed(() => `${(editor.wer.value * 100).toFixed(1)}%`);
</script>

<template>
  <main class="card-container max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 my-4 sm:my-8">
    <div
      v-if="loadError"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-sans mb-6"
    >
      {{ loadError }}
    </div>

    <template v-else-if="recording">
      <div class="mb-6">
        <div class="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
          <button
            class="flex items-center gap-2 font-sans text-base text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:brightness-110 transition-all border-0 cursor-pointer bg-gradient-to-br from-sky-500 to-sky-700"
            @click="router.push('/queue')"
          >
            <ArrowLeft
              :size="16"
              :stroke-width="2"
            />
            Queue
          </button>
          <span class="flex items-center gap-2 min-w-0">
            <FileAudio
              :size="16"
              :stroke-width="1.5"
              class="text-warm-400 shrink-0"
            />
            <h1 class="font-mono text-base sm:text-lg font-medium text-warm-900 m-0 truncate">
              {{ recording.originalFilename }}
            </h1>
          </span>
          <Badge :status="recording.status as RecordingStatus" />
          <span
            v-if="editor.transcript.value"
            class="sm:ml-auto font-sans text-xs text-warm-500"
            title="Word Error Rate — corrected vs original"
          >
            WER · <span class="font-mono text-warm-700">{{ werPercent }}</span>
          </span>
        </div>

        <div class="flex flex-wrap gap-3 sm:gap-5 font-sans text-sm text-clin-600">
          <span class="flex items-center gap-1.5">
            <Clock
              :size="13"
              :stroke-width="1.5"
              class="shrink-0"
            />
            {{ formatDuration(recording.durationSeconds) }}
          </span>
          <span class="flex items-center gap-1.5">
            <Activity
              :size="13"
              :stroke-width="1.5"
              class="shrink-0"
            />
            {{ recording.sampleRate / 1000 }} kHz
          </span>
          <span class="flex items-center gap-1.5">
            <Headphones
              :size="13"
              :stroke-width="1.5"
              class="shrink-0"
            />
            {{ recording.channels === 1 ? 'Mono' : 'Stereo' }}
          </span>
        </div>
      </div>

      <section class="mb-5">
        <AudioPlayer
          ref="audioPlayerRef"
          :audio-url="audioUrl"
          :on-save-now="editor.saveNow"
          :on-complete-and-next="markCompleteAndNext"
        />
      </section>

      <p
        v-if="editor.error.value"
        class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-xs font-sans mb-4"
      >
        Transcript · {{ editor.error.value }}
      </p>

      <TranscriptView
        v-if="editor.transcript.value"
        :original-text="editor.transcript.value.originalText"
        :corrected-text="editor.correctedDraft.value"
        :word-timings="editor.transcript.value.wordTimings"
        :alignment-method="editor.transcript.value.alignmentMethod"
        :spans="spans"
        :saving="editor.saving.value"
        :last-saved-at="editor.lastSavedAt.value"
        @update:corrected="editor.setCorrected"
        @word-click="seekAudio"
        @selection="(sel) => currentSelection = sel"
        @selection-cleared="currentSelection = null"
      />

      <p
        v-else-if="editor.loading.value"
        class="font-sans text-sm text-warm-400 py-8 text-center"
      >
        Loading transcript…
      </p>

      <p
        v-if="spansError"
        class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-xs font-sans mb-4"
      >
        Annotations · {{ spansError }}
      </p>

      <ConditionsPanel :recording-id="props.id" />

      <SpanPopover
        :anchor-rect="currentSelection?.rect ?? null"
        :anchor-text="currentSelection?.anchorText ?? ''"
        @submit="onSubmitSpan"
        @cancel="clearSelection"
      />

      <footer class="flex justify-end items-center gap-3 pt-4 mt-6 border-t border-warm-200">
        <p
          v-if="statusError"
          class="font-sans text-sm text-red-600 m-0"
        >
          {{ statusError }}
        </p>
        <button
          class="bg-sage-500 hover:bg-sage-600 text-white font-sans font-medium text-sm px-5 py-2 rounded-lg transition-colors border-0 cursor-pointer disabled:bg-warm-300 disabled:cursor-not-allowed"
          :disabled="completing || recording.status === 'DONE'"
          @click="markCompleteAndNext"
        >
          {{ completing ? 'Saving…' : 'Complete & next' }}
        </button>
      </footer>
    </template>

    <p
      v-else
      class="text-center text-warm-400 font-sans text-sm py-16"
    >
      Loading recording…
    </p>
  </main>
</template>
