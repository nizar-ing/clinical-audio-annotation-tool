import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import { getTranscript, updateCorrected } from '../api/transcript.api.js';
import type { TranscriptDto, ReanchorReport } from '../api/transcript.api.js';

const AUTOSAVE_DEBOUNCE_MS = 750;

export interface UseTranscriptEditReturn {
  transcript: Ref<TranscriptDto | null>;
  loading: Ref<boolean>;
  saving: Ref<boolean>;
  error: Ref<string | null>;
  lastReanchor: Ref<ReanchorReport | null>;
  lastSavedAt: Ref<Date | null>;
  correctedDraft: Ref<string>;
  wer: Ref<number>;
  load(recordingId: string): Promise<void>;
  setCorrected(text: string): void;
  saveNow(): Promise<void>;
}

export function useTranscriptEdit(): UseTranscriptEditReturn {
  const transcript = ref<TranscriptDto | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
  const lastReanchor = ref<ReanchorReport | null>(null);
  const lastSavedAt = ref<Date | null>(null);
  const correctedDraft = ref('');

  let recordingId = '';
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const wer = computed(() => transcript.value?.werCached ?? 0);

  async function load(id: string): Promise<void> {
    recordingId = id;
    loading.value = true;
    error.value = null;
    try {
      const res = await getTranscript(id);
      transcript.value = res.data;
      correctedDraft.value = res.data.correctedText;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load transcript';
    } finally {
      loading.value = false;
    }
  }

  function setCorrected(text: string): void {
    correctedDraft.value = text;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { void saveNow(); }, AUTOSAVE_DEBOUNCE_MS);
  }

  async function saveNow(): Promise<void> {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    if (!recordingId || !transcript.value) return;
    if (correctedDraft.value === transcript.value.correctedText) return;

    saving.value = true;
    error.value = null;
    try {
      const res = await updateCorrected(recordingId, correctedDraft.value);
      transcript.value = res.data;
      lastReanchor.value = res.meta.reanchor;
      lastSavedAt.value = new Date();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Autosave failed';
    } finally {
      saving.value = false;
    }
  }

  return {
    transcript,
    loading,
    saving,
    error,
    lastReanchor,
    lastSavedAt,
    correctedDraft,
    wer,
    load,
    setCorrected,
    saveNow,
  };
}
