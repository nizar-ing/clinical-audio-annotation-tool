<script setup lang="ts">
import { ref } from 'vue';
import { Download } from 'lucide-vue-next';

const downloading = ref(false);
const error = ref<string | null>(null);

async function downloadExport() {
  downloading.value = true;
  error.value = null;
  try {
    const res = await fetch('/api/v1/export');
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = /filename="([^"]+)"/.exec(disposition);
    const filename = match?.[1] ?? 'clinannotate-export.jsonl';
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Export failed';
  } finally {
    downloading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <span
      v-if="error"
      class="font-sans text-xs text-red-600"
    >
      {{ error }}
    </span>
    <button
      class="flex items-center gap-1.5 font-sans text-base font-medium text-sage-700 no-underline transition-colors border-b-2 border-transparent pb-0.5 hover:text-sage-900 hover:border-sage-500 bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="downloading"
      :title="downloading ? 'Exporting…' : 'Export DONE recordings as JSONL'"
      @click="downloadExport"
    >
      <Download
        :size="15"
        :stroke-width="1.5"
        class="shrink-0"
      />
      {{ downloading ? 'Exporting…' : 'Export' }}
    </button>
  </div>
</template>
