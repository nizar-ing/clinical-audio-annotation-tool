// Composition root — cross-cutting concerns and shared singletons live here.
// Each bounded context module creates its own adapters in its module factory.
//
// Modules wired so far:
//   phase 2: ingestion (upload, import, pair/unpair) — mounted in app.ts
//
// Remaining phases:
//   phase 3: transcription (immutable original, corrected text, WER)
//   phase 4: annotation (spans, six types, unit normalisation)
//   phase 5: audio-analysis (ffprobe conditions, speech rate, distance)
//   phase 6: work-queue + export (JSONL gold standard)

export function buildContainer() {
  return {};
}
