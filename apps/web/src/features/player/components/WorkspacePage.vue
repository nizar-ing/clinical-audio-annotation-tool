<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, FileAudio, Clock, Activity, Headphones } from 'lucide-vue-next';
import AudioPlayer from './AudioPlayer.vue';
import Badge from '../../../shared/ui/Badge.vue';
import { getRecording, updateQueueStatus } from '../../work-queue/api/queue.api.js';
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

onMounted(async () => {
  try {
    const res = await getRecording(props.id);
    recording.value = res.data as FullRecording;

    // Transition QUEUED → IN_PROGRESS when the annotator opens the workspace
    if (recording.value.status === 'QUEUED') {
      const updated = await updateQueueStatus(props.id, 'IN_PROGRESS');
      recording.value = { ...recording.value, status: updated.data.status };
    }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Failed to load recording';
  }
});

async function markComplete() {
  if (!recording.value) return;
  completing.value = true;
  statusError.value = null;
  try {
    await updateQueueStatus(props.id, 'DONE');
    router.push('/queue');
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
</script>

<template>
  <main class="card-container max-w-5xl mx-auto px-6 py-8 my-8">
    <div
      v-if="loadError"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-sans mb-6"
    >
      {{ loadError }}
    </div>

    <template v-else-if="recording">
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <button
            class="flex items-center gap-1.5 font-sans text-sm text-warm-400 hover:text-sage-600 transition-colors bg-transparent border-0 cursor-pointer p-0"
            @click="router.push('/queue')"
          >
            <ArrowLeft
              :size="14"
              :stroke-width="2"
            />
            Queue
          </button>
          <span class="flex items-center gap-2">
            <FileAudio
              :size="16"
              :stroke-width="1.5"
              class="text-warm-400 shrink-0"
            />
            <h1 class="font-mono text-lg font-medium text-warm-900 m-0">
              {{ recording.originalFilename }}
            </h1>
          </span>
          <Badge :status="recording.status as RecordingStatus" />
        </div>

        <div class="flex gap-5 font-sans text-sm text-clin-600">
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
        <AudioPlayer :audio-url="audioUrl" />
      </section>

      <section class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-white rounded-lg border border-warm-200 shadow-sm p-4 min-h-40">
          <p class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 m-0 mb-3">
            Original AI transcript
          </p>
          <p class="font-sans text-sm text-warm-300 m-0">
            Transcript editor available in the next phase.
          </p>
        </div>
        <div class="bg-white rounded-lg border border-warm-200 shadow-sm p-4 min-h-40">
          <p class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 m-0 mb-3">
            Corrected transcript &amp; annotations
          </p>
          <p class="font-sans text-sm text-warm-300 m-0">
            Transcript editor available in the next phase.
          </p>
        </div>
      </section>

      <footer class="flex justify-end items-center gap-3 pt-4 border-t border-warm-200">
        <p
          v-if="statusError"
          class="font-sans text-sm text-red-600 m-0"
        >
          {{ statusError }}
        </p>
        <button
          class="bg-sage-500 hover:bg-sage-600 text-white font-sans font-medium text-sm px-5 py-2 rounded-lg transition-colors border-0 cursor-pointer disabled:bg-warm-300 disabled:cursor-not-allowed"
          :disabled="completing || recording.status === 'DONE'"
          @click="markComplete"
        >
          {{ completing ? 'Saving…' : 'Mark Complete' }}
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
