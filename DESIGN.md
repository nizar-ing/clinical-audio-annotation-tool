# DESIGN.md: ClinAnnotate

Time spent: recorded at submission. Written against section 6.5 of the brief. Longer reasoning lives in [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md); this page is the summary.

---

## 1. Data model

Six bounded contexts, five persisted aggregates. Prisma handles persistence; domain entities are hand-written and mapped deliberately.

```
Recording (aggregate root)      the audio file and its header metadata
  id, originalFilename, storageKey, mimeType, sizeBytes
  durationSeconds, sampleRate, channels, bitDepth (nullable)
  headerMetadata (JSONB), status, annotator, createdAt

Transcript (aggregate root)     one per Recording, created on pairing
  recordingId, originalText (immutable), correctedText
  wordTimings (JSONB, nullable), alignmentMethod
  werCached, updatedAt

AnnotationSpan                  child of Transcript
  transcriptId, spanType, startOffset, endOffset
  anchorText, attributes (JSONB), needsReview, createdAt

RecordingConditions             one per Recording
  derivedSpeechRateWpm, overrideSpeechRateWpm
  derivedDistanceBucket, overrideDistanceBucket, distanceMethod

ImportRow                       one per uploaded transcript row, matched or not
  path, label, matchedRecordingId, errorCode, createdAt
```

**Why this shape:**

Original and corrected transcripts sit on the same row because the pair is always read and written together — the original exists specifically so error rates can be computed against it. Immutability is enforced at two levels: no route or repository method writes `originalText`, and a `BEFORE UPDATE` trigger raises a database exception if it ever changes. A rule this load-bearing needs a structural guarantee, not just a convention.

Span attributes are JSONB rather than six type-specific tables. With one annotator and a few hundred rows, six migrations and six repositories would add real cost for no practical gain. Type safety comes from a discriminated Zod union keyed on `spanType`, validated on every write and read. That decision would change if the tool ever needed cross-type corpus queries — but it does not, and designing for that now would be premature.

`ImportRow` stores every uploaded transcript row, matched or not. Nothing is dropped silently. A persistent row with a nullable `matchedRecordingId` makes the pairing review screen a simple query and leaves a permanent record of what failed to match and why. The row's `label` is copied into `Transcript.originalText` when pairing succeeds — deliberate duplication, because the import row is immutable staging and the transcript is working state. Unpairing must never touch annotation data.

Spans store character offsets into `correctedText` plus an `anchorText` snapshot of the substring they covered at creation. Offsets alone break whenever an annotator edits text before a span. After an edit, the system searches for `anchorText` near the old offset and re-points the span. If the text can no longer be found, `needsReview` is set and a badge appears. Silently deleting or silently misplacing a span in data that becomes a training set is not acceptable.

## 2. Tradeoffs

| Decision | Chosen | Given up |
|---|---|---|
| Layering | Hexagonal per bounded context; domain imports nothing external | Roughly an hour of mapping code, versus a controllers/services/models split |
| Prisma | Confined to `infrastructure/adapters`; domain entities hand written | Prisma's generated types as free domain types |
| Span attributes | JSONB plus a Zod discriminated union | Database constraints, and cross-corpus attribute queries |
| Overlapping spans | Allowed, no constraint | Simpler rendering. Version 1 draws the outermost span inline and lists shadowed spans beside it |
| Word timestamps | Estimated from audio energy (section 4) | The accuracy of real forced alignment |
| Frontend state | Per-feature composables, no store library | Devtools time travel, which is not worth a dependency at this scale |
| Domain events and CQRS | None | Decoupling that one annotator on one machine does not need |

The last row deserves a direct defence. I have built the full tactical pattern before — aggregates, domain events, CQRS buses and sagas on NestJS. Adding an event bus here would cost around two hours and buy nothing that a direct method call does not already provide. The brief explicitly states that time spent on machinery the system does not need counts against the submission.

## 3. Stack compliance and deliberate deviations

| Required | Shipped | Note |
|---|---|---|
| Node 22 | Node 22 | — |
| TypeScript | TypeScript 6, strict mode | — |
| Express | Express 5 | current stable release; see below |
| Prisma | Prisma 7 | driver adapter required; `@prisma/adapter-pg` wired in |
| PostgreSQL | PostgreSQL 16 | — |
| Vue 3, Composition API, `<script setup>` | Vue 3 | applied throughout |
| yarn or bun | Yarn 4 workspaces | api, web, contracts |
| Docker Compose | Docker Compose | Postgres healthcheck ensures readiness before migrations run |

**Express 5.** The brief specifies Express without pinning a version. Express 5 is the current stable release. The main practical difference from Express 4 in this codebase is that unhandled promise rejections in route handlers propagate to the error middleware automatically, keeping route code cleaner. There are no breaking changes that affect this project.

**NestJS vs bare Express.** NestJS runs on the Express adapter, so it arguably satisfies the letter of the brief, and it would supply the dependency injection container, module boundaries and exception filters this architecture wants. I kept bare Express because an architecture that only holds together while a framework enforces it has not really been demonstrated. The composition root is hand-written in `src/main/container.ts`, and a dependency-cruiser rule inside `yarn test` asserts that no file under any `*/domain/` folder imports Express, Prisma, Zod or a Node built-in. A reviewer verifies the architectural claim by running the tests — a stronger argument than any README paragraph.

**Drizzle vs Prisma.** The schema needs raw SQL for the immutability trigger, which Drizzle handles more naturally. But Prisma Migrate supports custom SQL migrations perfectly well with a single `sql` block. The difference came down to familiarity rather than capability, and that is not a reason to deviate from an explicit requirement.

Three choices go beyond what the brief specifies, listed here so they read as decisions rather than gaps:

`ffmpeg-static` and `ffprobe-static` ship as npm dependencies. The brief's bar is `docker compose up` plus one command with no follow-up questions. A reviewer on a clean machine has no ffmpeg installed, and "install ffmpeg first" is a follow-up question.

A third workspace, `packages/contracts`, holds the Zod schemas for all six annotation types. Both the API and the frontend import from it, so validation logic cannot drift between them.

A `BEFORE UPDATE` trigger on `Transcript` enforces `originalText` immutability at the database level, in addition to the application layer.

The role advertisement asks for React; the brief mandates Vue 3. I built Vue, as specified. The feature folder structure maps directly onto a React codebase.

## 4. Ambiguous requirements, and how they were resolved

**Word-level timestamps have no source.** Section 4.3 requires that clicking a word seeks the audio to that word's timestamp. The supplied transcript format is `{path, label}` — no timings anywhere — and section 5 forbids implementing a speech model. As literally stated, the requirement cannot be satisfied. How you handle that is the actual test.

The tool ships an estimated alignment, framed the same way the brief frames its own distance estimate: labelled, with a documented method. The audio is decoded once to 16 kHz mono PCM. RMS is computed over 25 ms frames. A noise floor is taken from the fifth percentile of frame energy, and frames above that floor by a fixed margin are grouped into speech regions. Tokens are distributed across those regions proportionally to character length, skipping silence. On dictation — which is full of pauses — this is noticeably better than linear interpolation, and it reuses the frame series already computed for the distance estimate: one decode, two features. The interface labels word positions as estimated; the export carries `alignment.method`. The importer also accepts an optional `words` array of `{w, start, end}` objects and prefers real timings whenever a future speech model provides them.

WhisperX, the Montreal Forced Aligner and wav2vec2 forced alignment all violate section 5, require a model download, and break the clean-install promise.

**"CRUD" is not a seventh span type.** It appears in section 4.5 alongside six types that carry typed attributes, described only as correcting, adding and deleting tokens, with no attributes in the worked example. I read it as the transcript editing capability described in section 4.4.

**Recordings of 15 seconds or less are stored, not discarded.** The brief says rejected, not deleted. These recordings are persisted with status `REJECTED_TOO_SHORT` and remain visible in the queue behind a filter. The comparison uses the raw float from ffprobe with no rounding, and is tested at 14.999, 15.000 and 15.001 seconds.

**"Annotator" against "no user management."** Section 4.2 requires an annotator column; section 5 forbids authentication, users and roles. The annotator field is a plain editable string on `Recording`, defaulting to `annotator-1`. If multi-annotator work were ever in scope, that becomes a foreign key and a claim mechanism — the next increment, not this one.

**Filename pairing is a specified ladder, not a heuristic.** The brief's own example pairs the path `audio/880_NTX.wav` against a file named `880_NTX.wav`, so exact path equality matches nothing at all. The ladder tries: exact path, then basename, then basename case-insensitively, then stem without extension. Two uploads sharing a basename are flagged as ambiguous — neither is paired automatically, because guessing there would silently corrupt a training set. Every rung has a test.

**`IE` and `mmHg` are never converted.** International units measure substance-specific potency with no fixed mass equivalent. There is no second pressure unit in scope for `mmHg`. `Ch` normalises to millimetres at one third of a millimetre per Charrière, alongside `mm` and `cm`.

**Bit depth is null for MP3 and M4A.** The panel renders "not applicable for compressed formats" rather than a zero. `bext` and `LIST INFO` are RIFF chunks; they appear in WAV files only.

## 5. What was cut, and what comes next

In order of restoration priority:

1. **Undo and redo across span operations.** Text edits fall back to native browser undo. Doing this properly means a command stack of invertible operations that also restores spans invalidated by an undone edit — around three hours of work. Getting it half right loses annotator data, which is worse than not having it at all.
2. **Spelling alphabet detection for `SPELLED_OUT`.** The type ships, but the annotator types the resolved word rather than the tool inferring "C wie Caesar." A lookup table over the German spelling alphabet is roughly 40 minutes and would be the first addition.
3. **MinIO wiring.** The `AudioStoragePort` and both adapters exist; only the local disk adapter is connected, since the brief targets a single machine. Switching is a one-line change in the composition root.
4. **Nested span rendering.** Overlaps are stored correctly, but version 1 draws the outermost span inline and lists shadowed spans in the side panel.
5. **German tokenisation for the speech rate.** Splitting on whitespace is transparent and cheap. Compound-heavy medical German deserves a morphological tokeniser, which would also improve word alignment quality.

The next real increment beyond those is corpus-level analytics. Word error rate is computed per item and exported, but aggregating it by recording condition — speech rate band, distance bucket, sample rate — is what actually tells a modelling team where the speech model is weakest. That is the reason this data exists in the first place.