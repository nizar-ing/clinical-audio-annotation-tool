// Composition root. Constructs every adapter once and passes them into each
// context's module factory. The dependency graph for the whole system is
// visible here and nowhere else.
//
// Modules assembled here in subsequent phases:
//   phase 1: ingestion module (recording upload, transcript import, pairing)
//   phase 2: transcription module (immutable original, corrected, WER)
//   phase 3: annotation module (spans, six types, unit normalisation)
//   phase 4: audio-analysis module (ffprobe, PCM decode, speech rate, distance)
//   phase 5: work-queue module (queue read model, routing rule)
//   phase 5: export module (JSONL gold standard)

export function buildContainer() {
  return {};
}
