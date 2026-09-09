<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
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
  <main class="workspace">
    <div
      v-if="loadError"
      class="workspace__error"
    >
      {{ loadError }}
    </div>

    <template v-else-if="recording">
      <div class="workspace__header">
        <div class="workspace__title-row">
          <button
            class="workspace__back"
            @click="router.push('/queue')"
          >
            ← Queue
          </button>
          <h1 class="workspace__title">
            {{ recording.originalFilename }}
          </h1>
          <Badge :status="recording.status as RecordingStatus" />
        </div>

        <div class="workspace__meta">
          <span>{{ formatDuration(recording.durationSeconds) }}</span>
          <span>{{ recording.sampleRate / 1000 }} kHz</span>
          <span>{{ recording.channels === 1 ? 'Mono' : 'Stereo' }}</span>
        </div>
      </div>

      <section class="workspace__player">
        <AudioPlayer :audio-url="audioUrl" />
      </section>

      <section class="workspace__panels">
        <div class="workspace__panel workspace__panel--placeholder">
          <p class="workspace__placeholder-label">
            Original AI transcript
          </p>
          <p class="workspace__placeholder-note">
            Transcript editor available in the next phase.
          </p>
        </div>
        <div class="workspace__panel workspace__panel--placeholder">
          <p class="workspace__placeholder-label">
            Corrected transcript &amp; annotations
          </p>
          <p class="workspace__placeholder-note">
            Transcript editor available in the next phase.
          </p>
        </div>
      </section>

      <footer class="workspace__footer">
        <p
          v-if="statusError"
          class="workspace__error workspace__error--inline"
        >
          {{ statusError }}
        </p>
        <button
          class="workspace__btn workspace__btn--complete"
          :disabled="completing || recording.status === 'DONE'"
          @click="markComplete"
        >
          {{ completing ? 'Saving…' : 'Mark Complete' }}
        </button>
      </footer>
    </template>

    <p
      v-else
      class="workspace__loading"
    >
      Loading recording…
    </p>
  </main>
</template>

<style scoped>
.workspace {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}
.workspace__header {
  margin-bottom: 20px;
}
.workspace__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.workspace__back {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 0;
}
.workspace__back:hover { color: #111827; }
.workspace__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  font-family: monospace;
}
.workspace__meta {
  display: flex;
  gap: 16px;
  font-size: 0.8rem;
  color: #6b7280;
}
.workspace__player {
  margin-bottom: 20px;
}
.workspace__panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.workspace__panel {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  min-height: 160px;
}
.workspace__panel--placeholder {
  background: #f9fafb;
}
.workspace__placeholder-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 8px;
}
.workspace__placeholder-note {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
}
.workspace__footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}
.workspace__btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.1s;
}
.workspace__btn--complete {
  background: #6366f1;
  color: white;
}
.workspace__btn--complete:hover:not(:disabled) {
  background: #4f46e5;
}
.workspace__btn--complete:disabled {
  background: #c7d2fe;
  cursor: not-allowed;
}
.workspace__error {
  color: #dc2626;
  background: #fee2e2;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.875rem;
  margin-bottom: 16px;
}
.workspace__error--inline {
  margin-bottom: 0;
}
.workspace__loading {
  text-align: center;
  color: #9ca3af;
  padding: 48px;
}
</style>
