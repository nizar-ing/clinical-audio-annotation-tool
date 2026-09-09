import { ref } from 'vue';
import { importTranscripts, type ImportResult } from '../api/ingestion.api.js';

export function useTranscriptImport() {
  const importing = ref(false);
  const result = ref<ImportResult | null>(null);
  const error = ref<string | null>(null);

  async function importFromText(json: string): Promise<void> {
    if (!json.trim()) {
      error.value = 'Paste a JSON array before importing.';
      return;
    }
    importing.value = true;
    error.value = null;
    try {
      result.value = await importTranscripts(json);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Import failed';
    } finally {
      importing.value = false;
    }
  }

  async function importFromFile(file: File): Promise<void> {
    const text = await file.text();
    await importFromText(text);
  }

  return { importing, result, error, importFromText, importFromFile };
}
