import { ref, onMounted } from 'vue';
import { listUnpaired, pairRow, unpairRow, type UnpairedRecording, type UnmatchedRow } from '../api/ingestion.api.js';

export function usePairingReview() {
  const recordings = ref<UnpairedRecording[]>([]);
  const rows = ref<UnmatchedRow[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function refresh(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const data = await listUnpaired();
      recordings.value = data.recordings;
      rows.value = data.rows;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load pairing data';
    } finally {
      loading.value = false;
    }
  }

  async function pair(rowId: string, recordingId: string): Promise<void> {
    await pairRow(rowId, recordingId);
    await refresh();
  }

  async function unpair(rowId: string): Promise<void> {
    await unpairRow(rowId);
    await refresh();
  }

  onMounted(() => { void refresh(); });

  return { recordings, rows, loading, error, refresh, pair, unpair };
}
