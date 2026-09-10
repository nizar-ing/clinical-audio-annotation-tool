<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Upload,
  FileJson,
  GitMerge,
  Loader2,
  CheckCircle2,
  XCircle,
  FileAudio,
  ArrowRight,
} from 'lucide-vue-next';
import { useAudioUpload } from '../composables/useAudioUpload.js';
import { useTranscriptImport } from '../composables/useTranscriptImport.js';
import { usePairingReview } from '../composables/usePairingReview.js';

const { uploading, results: uploadResults, error: uploadError, upload } = useAudioUpload();
const { importing, result: importResult, error: importError, importFromText, importFromFile } = useTranscriptImport();
const { recordings: unpairedRecs, rows: unmatchedRows, matchedRows, loading: pairingLoading, error: pairingError, refresh: refreshPairing, pair, unpair } = usePairingReview();

// ── Audio upload ──────────────────────────────────────────────────────────
const isDragging = ref(false);
const audioInput = ref<HTMLInputElement | null>(null);

function onAudioDrop(e: DragEvent): void {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
    /\.(wav|mp3|m4a)$/i.test(f.name),
  );
  void doUpload(files);
}

function onAudioPick(e: Event): void {
  const files = Array.from((e.target as HTMLInputElement).files ?? []);
  void doUpload(files);
}

async function doUpload(files: File[]): Promise<void> {
  await upload(files);
  void refreshPairing();
}

// ── Transcript import ─────────────────────────────────────────────────────
const jsonText = ref('');
const jsonInput = ref<HTMLInputElement | null>(null);

function onJsonPick(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    void (async () => {
      await importFromFile(file);
      void refreshPairing();
    })();
  }
}

async function doImport(): Promise<void> {
  await importFromText(jsonText.value);
  void refreshPairing();
}

// ── Pairing ───────────────────────────────────────────────────────────────
const selectedRowId = ref<Record<string, string>>({});

async function submitPair(recordingId: string): Promise<void> {
  const rowId = selectedRowId.value[recordingId];
  if (!rowId) return;
  await pair(rowId, recordingId);
  delete selectedRowId.value[recordingId];
}

// Refresh pairing after upload results or import results change
watch(uploadResults, () => { void refreshPairing(); });
watch(importResult, () => { void refreshPairing(); });

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
    <!-- ── Page heading ───────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="font-display text-2xl font-semibold text-warm-900 m-0">
        Ingest Recordings
      </h1>
      <RouterLink
        to="/queue"
        class="ml-auto font-sans text-base text-white no-underline flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg hover:brightness-110 transition-all bg-gradient-to-br from-sky-500 to-sky-700"
      >
        Go to queue
        <ArrowRight
          :size="16"
          :stroke-width="2"
        />
      </RouterLink>
    </div>

    <!-- ── Section 1: Audio upload ────────────────────────────────────── -->
    <section class="card-container px-4 sm:px-6 py-5 space-y-4">
      <div class="flex items-center gap-2">
        <Upload
          :size="17"
          :stroke-width="1.5"
          class="text-clin-500 shrink-0"
        />
        <h2 class="font-display text-lg font-semibold text-warm-800 m-0">
          Upload Audio
        </h2>
      </div>

      <!-- Drop zone -->
      <div
        class="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer select-none transition-colors duration-150"
        :class="isDragging
          ? 'border-clin-400 bg-clin-50'
          : 'border-warm-300 hover:border-clin-300 hover:bg-clin-50'"
        @click="audioInput?.click()"
        @dragover.prevent
        @dragenter.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onAudioDrop"
      >
        <Upload
          :size="28"
          :stroke-width="1.25"
          class="mx-auto mb-3 text-warm-300"
        />
        <p class="font-sans text-sm text-warm-500 m-0">
          Drop <span class="font-mono text-warm-700">.wav .mp3 .m4a</span> files here, or click to browse
        </p>
        <input
          ref="audioInput"
          type="file"
          multiple
          accept=".wav,.mp3,.m4a"
          class="hidden"
          @change="onAudioPick"
        >
      </div>

      <!-- Upload loading -->
      <div
        v-if="uploading"
        class="flex items-center gap-2 font-sans text-sm text-warm-400"
      >
        <Loader2
          :size="16"
          :stroke-width="1.5"
          class="animate-spin text-clin-400"
        />
        Uploading…
      </div>

      <!-- Upload error -->
      <p
        v-if="uploadError"
        class="font-sans text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 m-0"
      >
        {{ uploadError }}
      </p>

      <!-- Per-file results -->
      <ul
        v-if="uploadResults.length"
        class="space-y-1 list-none p-0 m-0"
      >
        <li
          v-for="r in uploadResults"
          :key="r.originalFilename"
          class="flex items-center gap-2 font-sans text-sm"
        >
          <CheckCircle2
            v-if="!r.error"
            :size="14"
            :stroke-width="1.5"
            class="text-sage-500 shrink-0"
          />
          <XCircle
            v-else
            :size="14"
            :stroke-width="1.5"
            class="text-red-400 shrink-0"
          />
          <span class="font-mono text-warm-700">{{ r.originalFilename }}</span>
          <span
            v-if="!r.error"
            class="text-warm-400"
          >
            {{ r.status }} · {{ formatDuration(r.durationSeconds) }}
          </span>
          <span
            v-else
            class="text-red-500"
          >
            {{ r.error }}
          </span>
        </li>
      </ul>
    </section>

    <!-- ── Section 2: Transcript import ──────────────────────────────── -->
    <section class="card-container px-4 sm:px-6 py-5 space-y-4">
      <div class="flex items-center gap-2">
        <FileJson
          :size="17"
          :stroke-width="1.5"
          class="text-harvest-500 shrink-0"
        />
        <h2 class="font-display text-lg font-semibold text-warm-800 m-0">
          Import Transcripts
        </h2>
      </div>

      <p class="font-sans text-sm text-warm-500 m-0">
        Paste a JSON array of
        <span class="font-mono text-warm-700">{"path":"audio/file.wav","label":"..."}</span>
        objects, or load from a <span class="font-mono text-warm-700">.json</span> file.
      </p>

      <textarea
        v-model="jsonText"
        placeholder="[{&quot;path&quot;:&quot;audio/demo-01.wav&quot;,&quot;label&quot;:&quot;Transkript text...&quot;}]"
        rows="5"
        class="w-full font-mono text-sm text-warm-800 bg-warm-50 border border-warm-200 rounded-lg px-3 py-2 resize-y focus:outline-none focus:border-clin-400 focus:ring-1 focus:ring-clin-200 placeholder:text-warm-300"
      />

      <div class="flex flex-wrap items-center gap-3">
        <button
          class="font-sans text-sm font-medium px-4 py-2 rounded-lg bg-harvest-400 text-white hover:bg-harvest-500 transition-colors disabled:opacity-50"
          :disabled="importing"
          @click="void doImport()"
        >
          <span
            v-if="importing"
            class="flex items-center gap-2"
          >
            <Loader2
              :size="14"
              :stroke-width="1.5"
              class="animate-spin"
            />
            Importing…
          </span>
          <span v-else>Import</span>
        </button>

        <button
          class="font-sans text-sm font-medium px-4 py-2 rounded-lg border border-warm-200 text-warm-600 hover:border-warm-300 hover:text-warm-800 transition-colors"
          @click="jsonInput?.click()"
        >
          Load from file
        </button>
        <input
          ref="jsonInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="onJsonPick"
        >
      </div>

      <!-- Import error -->
      <p
        v-if="importError"
        class="font-sans text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 m-0"
      >
        {{ importError }}
      </p>

      <!-- Import result summary -->
      <div
        v-if="importResult"
        class="rounded-lg border border-warm-200 divide-y divide-warm-100 font-sans text-sm"
      >
        <div class="px-4 py-2 flex items-center gap-2 text-sage-700">
          <CheckCircle2
            :size="14"
            :stroke-width="1.5"
            class="shrink-0"
          />
          {{ importResult.matched.length }} matched and queued
        </div>
        <div
          v-if="importResult.unmatchedRows.length"
          class="px-4 py-2 text-warm-500"
        >
          {{ importResult.unmatchedRows.length }} transcript row{{ importResult.unmatchedRows.length !== 1 ? 's' : '' }} unmatched — see Pairing Review below
        </div>
        <div
          v-if="importResult.errors.length"
          class="px-4 py-2 text-red-600"
        >
          {{ importResult.errors.length }} row{{ importResult.errors.length !== 1 ? 's' : '' }} skipped due to errors
        </div>
        <ul
          v-if="importResult.errors.length"
          class="px-4 py-2 space-y-0.5 list-none m-0"
        >
          <li
            v-for="err in importResult.errors"
            :key="err.index"
            class="text-red-500 text-xs font-mono"
          >
            [{{ err.index >= 0 ? `row ${err.index}` : 'parse' }}]
            <span v-if="err.path">{{ err.path }}: </span>{{ err.reason }}
          </li>
        </ul>
      </div>
    </section>

    <!-- ── Section 3: Pairing review ──────────────────────────────────── -->
    <section class="card-container px-4 sm:px-6 py-5 space-y-4">
      <div class="flex items-center gap-2">
        <GitMerge
          :size="17"
          :stroke-width="1.5"
          class="text-sage-500 shrink-0"
        />
        <h2 class="font-display text-lg font-semibold text-warm-800 m-0">
          Pairing Review
        </h2>
        <button
          class="ml-auto font-sans text-xs text-warm-400 hover:text-warm-600 transition-colors"
          @click="void refreshPairing()"
        >
          Refresh
        </button>
      </div>

      <!-- Loading -->
      <div
        v-if="pairingLoading"
        class="flex items-center gap-2 font-sans text-sm text-warm-400 py-4"
      >
        <Loader2
          :size="16"
          :stroke-width="1.5"
          class="animate-spin text-clin-400"
        />
        Loading…
      </div>

      <!-- Error -->
      <p
        v-else-if="pairingError"
        class="font-sans text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 m-0"
      >
        {{ pairingError }}
      </p>

      <template v-else>
        <!-- Empty state: nothing to show at all -->
        <div
          v-if="!unpairedRecs.length && !unmatchedRows.length && !matchedRows.length"
          class="flex flex-col items-center gap-3 py-8 font-sans text-sm text-warm-400"
        >
          <CheckCircle2
            :size="28"
            :stroke-width="1.25"
            class="text-sage-400"
          />
          All recordings are paired.
          <RouterLink
            to="/queue"
            class="text-white no-underline font-semibold transition-all flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:brightness-110 bg-gradient-to-br from-sky-500 to-sky-700"
          >
            Go to queue
            <ArrowRight
              :size="15"
              :stroke-width="2"
            />
          </RouterLink>
        </div>

        <!-- Two-column review: unmatched audio + unmatched transcript rows -->
        <div
          v-if="unpairedRecs.length || unmatchedRows.length"
          class="grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          <!-- Unmatched audio -->
          <div>
            <p class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 mb-3">
              Unmatched audio ({{ unpairedRecs.length }})
            </p>
            <div
              v-if="!unpairedRecs.length"
              class="font-sans text-sm text-warm-300 italic"
            >
              None
            </div>
            <ul
              v-else
              class="space-y-3 list-none p-0 m-0"
            >
              <li
                v-for="rec in unpairedRecs"
                :key="rec.id"
                class="rounded-lg border border-warm-200 px-3 py-3 space-y-2"
              >
                <div class="flex items-center gap-2">
                  <FileAudio
                    :size="14"
                    :stroke-width="1.5"
                    class="text-warm-300 shrink-0"
                  />
                  <span class="font-mono text-sm text-warm-800 truncate">{{ rec.originalFilename }}</span>
                  <span class="font-sans text-xs text-warm-400 shrink-0">{{ formatDuration(rec.durationSeconds) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <select
                    v-model="selectedRowId[rec.id]"
                    class="flex-1 font-mono text-xs text-warm-700 bg-warm-50 border border-warm-200 rounded px-2 py-1 focus:outline-none focus:border-clin-400"
                  >
                    <option value="">
                      — select transcript row —
                    </option>
                    <option
                      v-for="row in unmatchedRows"
                      :key="row.id"
                      :value="row.id"
                    >
                      {{ row.path }}
                    </option>
                  </select>
                  <button
                    class="font-sans text-xs font-medium px-3 py-1 rounded bg-sage-600 text-white hover:bg-sage-700 transition-colors disabled:opacity-40"
                    :disabled="!selectedRowId[rec.id]"
                    @click="void submitPair(rec.id)"
                  >
                    Pair
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Unmatched transcript rows -->
          <div>
            <p class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 mb-3">
              Unmatched transcript rows ({{ unmatchedRows.length }})
            </p>
            <div
              v-if="!unmatchedRows.length"
              class="font-sans text-sm text-warm-300 italic"
            >
              None
            </div>
            <ul
              v-else
              class="space-y-2 list-none p-0 m-0"
            >
              <li
                v-for="row in unmatchedRows"
                :key="row.id"
                class="rounded-lg border border-warm-200 px-3 py-2"
              >
                <p class="font-mono text-sm text-warm-700 m-0 truncate">
                  {{ row.path }}
                </p>
                <p class="font-sans text-xs text-warm-400 m-0 mt-0.5 line-clamp-2">
                  {{ row.label }}
                </p>
              </li>
            </ul>
          </div>
        </div>

        <!-- Currently paired — always shown when matched rows exist, enabling unpair -->
        <div v-if="matchedRows.length">
          <p class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 mb-3 mt-2">
            Currently paired ({{ matchedRows.length }})
          </p>
          <ul class="space-y-2 list-none p-0 m-0">
            <li
              v-for="row in matchedRows"
              :key="row.id"
              class="rounded-lg border border-warm-100 bg-warm-50 px-3 py-2 flex items-center justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="font-mono text-sm text-warm-700 m-0 truncate">
                  {{ row.path }}
                </p>
                <p class="font-sans text-xs text-warm-400 m-0 mt-0.5 line-clamp-1">
                  {{ row.label }}
                </p>
              </div>
              <button
                class="font-sans text-xs font-medium px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors shrink-0"
                @click="void unpair(row.id)"
              >
                Unpair
              </button>
            </li>
          </ul>
        </div>
      </template>
    </section>
  </main>
</template>
