import { randomUUID } from 'crypto';
import { z } from 'zod';
import { PairingDomainService } from '../../../domain/services/pairing.domain-service.js';
import type { RecordingRepositoryPort } from '../../ports/recording.repository.port.js';
import type { ImportRowRepositoryPort } from '../../ports/import-row.repository.port.js';
import type { CreateTranscriptPort } from '../../ports/create-transcript.port.js';
import type { ImportTranscriptsCommand } from './import-transcripts.command.js';

const TranscriptRowSchema = z.object({
  path: z.string().min(1),
  label: z.string().min(1),
});

const TranscriptArraySchema = z.array(z.unknown());

export interface RowError {
  index: number;
  path?: string;
  reason: string;
}

export interface ImportResult {
  matched: { recordingId: string; importRowId: string; path: string }[];
  unmatchedAudio: { recordingId: string; originalFilename: string }[];
  unmatchedRows: { importRowId: string; path: string }[];
  errors: RowError[];
}

export class ImportTranscriptsHandler {
  constructor(
    private readonly importRows: ImportRowRepositoryPort,
    private readonly recordings: RecordingRepositoryPort,
    private readonly createTranscript: CreateTranscriptPort,
  ) {}

  async execute(cmd: ImportTranscriptsCommand): Promise<ImportResult> {
    const errors: RowError[] = [];

    // Parse outer JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(cmd.rawJson);
    } catch {
      return { matched: [], unmatchedAudio: [], unmatchedRows: [], errors: [{ index: -1, reason: 'Invalid JSON' }] };
    }

    const arrayResult = TranscriptArraySchema.safeParse(parsed);
    if (!arrayResult.success) {
      return { matched: [], unmatchedAudio: [], unmatchedRows: [], errors: [{ index: -1, reason: 'Expected a JSON array' }] };
    }

    // Validate each row individually
    const validRows: { path: string; label: string }[] = [];
    const seenPaths = new Set<string>();

    for (let i = 0; i < arrayResult.data.length; i++) {
      const rowResult = TranscriptRowSchema.safeParse(arrayResult.data[i]);
      if (!rowResult.success) {
        errors.push({ index: i, reason: rowResult.error.issues.map((e) => e.message).join('; ') });
        continue;
      }
      const { path, label } = rowResult.data;
      if (seenPaths.has(path)) {
        errors.push({ index: i, path, reason: `Duplicate path: ${path}` });
        continue;
      }
      seenPaths.add(path);
      validRows.push({ path, label });
    }

    // Load all recordings for pairing
    const allRecordings = await this.recordings.findAll();
    const pairableRecordings = allRecordings
      .filter((r) => r.status !== 'REJECTED_TOO_SHORT')
      .map((r) => ({ id: r.id, originalFilename: r.originalFilename, storagePath: r.originalFilename }));

    const pairableRows = validRows.map((r) => ({ id: randomUUID(), path: r.path, label: r.label }));

    const { matched, unmatchedAudio, unmatchedRows, ambiguous } = PairingDomainService.pair(
      pairableRecordings,
      pairableRows,
    );

    // Report ambiguous as errors
    for (const amb of ambiguous) {
      errors.push({ index: -1, path: amb.row.path, reason: `Ambiguous match: ${amb.candidates.length} recordings share this basename` });
    }

    // Persist all valid rows
    const savedMatched: ImportResult['matched'] = [];
    const savedUnmatched: ImportResult['unmatchedRows'] = [];

    for (const { recording, row } of matched) {
      const saved = await this.importRows.save({
        id: row.id,
        path: row.path,
        label: row.label,
        matchedRecordingId: recording.id,
        errorCode: null,
      });
      // Materialise the Transcript on pairing so the annotator workspace has something to load.
      // Cross-context call goes through a port; the adapter lives in the transcription module.
      await this.createTranscript.create({ recordingId: recording.id, originalText: row.label });
      await this.recordings.updateStatus(recording.id, 'QUEUED');
      savedMatched.push({ recordingId: recording.id, importRowId: saved.id, path: row.path });
    }

    for (const row of unmatchedRows) {
      const saved = await this.importRows.save({
        id: row.id,
        path: row.path,
        label: row.label,
        matchedRecordingId: null,
        errorCode: null,
      });
      savedUnmatched.push({ importRowId: saved.id, path: row.path });
    }

    const unmatchedAudioResult = unmatchedAudio
      .filter((r) => allRecordings.find((rec) => rec.id === r.id)?.status === 'UPLOADED')
      .map((r) => ({ recordingId: r.id, originalFilename: r.originalFilename }));

    return {
      matched: savedMatched,
      unmatchedAudio: unmatchedAudioResult,
      unmatchedRows: savedUnmatched,
      errors,
    };
  }
}
