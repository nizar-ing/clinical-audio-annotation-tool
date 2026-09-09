import { ref } from 'vue';
import { uploadAudio, type UploadResult } from '../api/ingestion.api.js';

export function useAudioUpload() {
  const uploading = ref(false);
  const results = ref<UploadResult[]>([]);
  const error = ref<string | null>(null);

  async function upload(files: File[]): Promise<void> {
    if (!files.length) return;
    uploading.value = true;
    error.value = null;
    try {
      const res = await uploadAudio(files);
      results.value = [...results.value, ...res];
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Upload failed';
    } finally {
      uploading.value = false;
    }
  }

  return { uploading, results, error, upload };
}
