import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, statSync } from 'fs';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../');
config({ path: resolve(repoRoot, '.env') });

const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const uploadsDir = resolve(repoRoot, 'uploads');
mkdirSync(uploadsDir, { recursive: true });

function copyFixture(filename: string): { storageKey: string; sizeBytes: number } {
  const src = resolve(repoRoot, 'fixtures', 'audio', filename);
  const dst = resolve(uploadsDir, filename);
  copyFileSync(src, dst);
  return { storageKey: filename, sizeBytes: statSync(dst).size };
}

async function main() {
  await prisma.$executeRaw`TRUNCATE TABLE "ImportRow", "AnnotationSpan", "RecordingConditions", "Transcript", "Recording" CASCADE`;

  // ── demo-01: happy path, ~40s WAV, paired ───────────────────────────────
  const { storageKey: sk01, sizeBytes: sb01 } = copyFixture('demo-01.wav');
  const rec01 = await prisma.recording.create({
    data: {
      originalFilename: 'demo-01.wav',
      storageKey: sk01,
      mimeType: 'audio/wav',
      sizeBytes: sb01,
      durationSeconds: 40.0,
      sampleRate: 44100,
      channels: 1,
      bitDepth: 16,
      headerMetadata: { listInfo: { INAM: 'Operationsbericht Demo 01', ISFT: 'Zoom H1n' } },
      status: 'QUEUED',
    },
  });
  const tx01 = await prisma.transcript.create({
    data: {
      recordingId: rec01.id,
      originalText:
        'Kontrollierte Rueckenlagerung des Patienten auf dem Operationstisch. Lagerungshilfen werden angelegt. Perioperative Antibiotikaprophylaxe mit Cefazolin zwei Gramm intravenoes wird gegeben. Schnitt in der Medianlinie. Praeperitoneale Praepaeration. Schrittweise Wundverschluss.',
      correctedText:
        'Kontrollierte Rückenlagerung des Patienten auf dem Operationstisch. Lagerungshilfen werden angelegt. Perioperative Antibiotikaprophylaxe mit Cefazolin 2 g i.v. wird gegeben. Schnitt in der Medianlinie. Präperitoneale Präparation. Schrittweiser Wundverschluss.',
      alignmentMethod: 'none',
    },
  });
  await prisma.recordingConditions.create({
    data: {
      recordingId: rec01.id,
      derivedSpeechRateWpm: 112,
      derivedDistanceBucket: 'normal',
      distanceMethod: 'RMS-to-noise-floor ratio over 25 ms frames; heuristic, not a calibrated measurement',
    },
  });
  await prisma.importRow.create({
    data: { path: 'audio/demo-01.wav', label: tx01.originalText, matchedRecordingId: rec01.id },
  });

  // ── demo-02: 12s WAV → REJECTED_TOO_SHORT ───────────────────────────────
  const { storageKey: sk02, sizeBytes: sb02 } = copyFixture('demo-02.wav');
  const rec02 = await prisma.recording.create({
    data: {
      originalFilename: 'demo-02.wav',
      storageKey: sk02,
      mimeType: 'audio/wav',
      sizeBytes: sb02,
      durationSeconds: 12.0,
      sampleRate: 44100,
      channels: 1,
      bitDepth: 16,
      status: 'REJECTED_TOO_SHORT',
    },
  });
  await prisma.importRow.create({
    data: {
      path: 'audio/demo-02.wav',
      label: 'Kurzer Testaufnahme fuer die Ablehnungsregel.',
      matchedRecordingId: rec02.id,
    },
  });

  // ── demo-03: MP3, paired ─────────────────────────────────────────────────
  const { storageKey: sk03, sizeBytes: sb03 } = copyFixture('demo-03.mp3');
  const rec03 = await prisma.recording.create({
    data: {
      originalFilename: 'demo-03.mp3',
      storageKey: sk03,
      mimeType: 'audio/mpeg',
      sizeBytes: sb03,
      durationSeconds: 30.0,
      sampleRate: 44100,
      channels: 1,
      bitDepth: null,
      status: 'IN_PROGRESS',
    },
  });
  const tx03 = await prisma.transcript.create({
    data: {
      recordingId: rec03.id,
      originalText:
        'Patient wird in Rueckenlage gelagert. Desinfektion und steriles Abdecken des Operationsfeldes. Inzision erfolgt.',
      correctedText:
        'Patient wird in Rückenlage gelagert. Desinfektion und steriles Abdecken des Operationsfeldes. Inzision erfolgt.',
      alignmentMethod: 'none',
    },
  });
  await prisma.recordingConditions.create({
    data: {
      recordingId: rec03.id,
      derivedSpeechRateWpm: 98,
      derivedDistanceBucket: 'close',
      distanceMethod: 'RMS-to-noise-floor ratio over 25 ms frames; heuristic, not a calibrated measurement',
    },
  });
  await prisma.importRow.create({
    data: { path: 'audio/demo-03.mp3', label: tx03.originalText, matchedRecordingId: rec03.id },
  });

  // ── demo-04: M4A, unmatched audio (no transcript row) ───────────────────
  const { storageKey: sk04, sizeBytes: sb04 } = copyFixture('demo-04.m4a');
  await prisma.recording.create({
    data: {
      originalFilename: 'demo-04.m4a',
      storageKey: sk04,
      mimeType: 'audio/mp4',
      sizeBytes: sb04,
      durationSeconds: 25.0,
      sampleRate: 44100,
      channels: 1,
      bitDepth: null,
      status: 'UNPAIRED',
    },
  });

  // ── demo-05: the brief's worked example, pre-annotated ──────────────────
  const { storageKey: sk05, sizeBytes: sb05 } = copyFixture('demo-05.wav');
  const rec05 = await prisma.recording.create({
    data: {
      originalFilename: 'demo-05.wav',
      storageKey: sk05,
      mimeType: 'audio/wav',
      sizeBytes: sb05,
      durationSeconds: 35.0,
      sampleRate: 44100,
      channels: 1,
      bitDepth: 16,
      status: 'DONE',
    },
  });
  const label05 =
    'Single-Shot-Antibiose mit Cefuroxim eintausendfuenfhundert Milligramm intravenoes. Blutdruck 120 zu 80. Neue Zeile. Wundverschluss mit sechs null Prolene.';
  const corrected05 =
    'Single-Shot-Antibiose mit Cefuroxim 1500 mg i.v. Blutdruck 120/80. Neue Zeile. Wundverschluss mit 6-0 Prolene.';
  const tx05 = await prisma.transcript.create({
    data: {
      recordingId: rec05.id,
      originalText: label05,
      correctedText: corrected05,
      alignmentMethod: 'none',
    },
  });
  await prisma.recordingConditions.create({
    data: {
      recordingId: rec05.id,
      derivedSpeechRateWpm: 118,
      derivedDistanceBucket: 'normal',
      distanceMethod: 'RMS-to-noise-floor ratio over 25 ms frames; heuristic, not a calibrated measurement',
    },
  });
  await prisma.importRow.create({
    data: { path: 'audio/demo-05.wav', label: label05, matchedRecordingId: rec05.id },
  });

  // Pre-seeded annotation spans for demo-05.
  // All offsets are into corrected05, all attributes include spanType so Zod parse succeeds.
  const cefuroximAnchor = 'Cefuroxim';
  const cefuroximStart = corrected05.indexOf(cefuroximAnchor);
  await prisma.annotationSpan.create({
    data: {
      transcriptId: tx05.id,
      spanType: 'MEDICAL_TERM',
      startOffset: cefuroximStart,
      endOffset: cefuroximStart + cefuroximAnchor.length,
      anchorText: cefuroximAnchor,
      attributes: { spanType: 'MEDICAL_TERM', category: 'drug' },
    },
  });

  const measurementAnchor = '1500 mg';
  const measurementStart = corrected05.indexOf(measurementAnchor);
  await prisma.annotationSpan.create({
    data: {
      transcriptId: tx05.id,
      spanType: 'MEASUREMENT',
      startOffset: measurementStart,
      endOffset: measurementStart + measurementAnchor.length,
      anchorText: measurementAnchor,
      attributes: { spanType: 'MEASUREMENT', value: 1500, unit: 'mg', normalizedValue: 1.5, normalizedUnit: 'g' },
    },
  });

  const formattingAnchor = 'Neue Zeile';
  const formattingStart = corrected05.indexOf(formattingAnchor);
  await prisma.annotationSpan.create({
    data: {
      transcriptId: tx05.id,
      spanType: 'FORMATTING_COMMAND',
      startOffset: formattingStart,
      endOffset: formattingStart + formattingAnchor.length,
      anchorText: formattingAnchor,
      attributes: { spanType: 'FORMATTING_COMMAND', command: 'newline', literal: false },
    },
  });

  const numberAnchor = '6-0';
  const numberStart = corrected05.indexOf(numberAnchor);
  await prisma.annotationSpan.create({
    data: {
      transcriptId: tx05.id,
      spanType: 'NUMBER',
      startOffset: numberStart,
      endOffset: numberStart + numberAnchor.length,
      anchorText: numberAnchor,
      attributes: { spanType: 'NUMBER', rendering: 'digits', normalized: '6/0' },
    },
  });

  // ── demo-99: unmatched transcript row (no audio file) ───────────────────
  await prisma.importRow.create({
    data: {
      path: 'audio/demo-99.wav',
      label: 'Transkriptzeile ohne passende Audiodatei. Dient zur Demonstration der ungematchten Eintraege.',
      matchedRecordingId: null,
    },
  });

  console.log('[seed] six fixtures loaded — one per status edge case.');
  console.log('  demo-01  QUEUED       (40s WAV with LIST INFO — happy path entry point)');
  console.log('  demo-02  REJECTED_TOO_SHORT  (12s WAV — duration gate)');
  console.log('  demo-03  IN_PROGRESS  (30s MP3 — active annotation session)');
  console.log('  demo-04  UNPAIRED     (25s M4A — no transcript match)');
  console.log('  demo-05  DONE         (35s WAV — pre-annotated with 4 spans)');
  console.log('  demo-99  unmatched ImportRow  (no audio file)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await pool.end(); });
