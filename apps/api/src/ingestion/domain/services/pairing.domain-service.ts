import { AudioFilename } from '../value-objects/audio-filename.vo.js';

export interface PairableRecording {
  id: string;
  originalFilename: string;
  storagePath: string;
}

export interface PairableRow {
  id: string;
  path: string;
  label: string;
}

export interface PairingMatch {
  recording: PairableRecording;
  row: PairableRow;
}

export interface AmbiguousMatch {
  row: PairableRow;
  candidates: PairableRecording[];
}

export interface PairingResult {
  matched: PairingMatch[];
  unmatchedAudio: PairableRecording[];
  unmatchedRows: PairableRow[];
  ambiguous: AmbiguousMatch[];
}

export class PairingDomainService {
  static pair(recordings: PairableRecording[], rows: PairableRow[]): PairingResult {
    const matched: PairingMatch[] = [];
    const ambiguous: AmbiguousMatch[] = [];
    const pairedRecordingIds = new Set<string>();
    const pairedRowIds = new Set<string>();

    for (const row of rows) {
      const rowFn = new AudioFilename(row.path);
      const candidates = this.findCandidates(recordings, rowFn);

      if (candidates.length === 0) continue;

      if (candidates.length > 1) {
        ambiguous.push({ row, candidates });
        pairedRowIds.add(row.id);
        continue;
      }

      const rec = candidates[0]!;
      if (pairedRecordingIds.has(rec.id)) {
        // Already matched to another row — leave this row unmatched
        continue;
      }

      matched.push({ recording: rec, row });
      pairedRecordingIds.add(rec.id);
      pairedRowIds.add(row.id);
    }

    const unmatchedAudio = recordings.filter((r) => !pairedRecordingIds.has(r.id));
    const unmatchedRows = rows.filter((r) => !pairedRowIds.has(r.id));

    return { matched, unmatchedAudio, unmatchedRows, ambiguous };
  }

  private static findCandidates(
    recordings: PairableRecording[],
    rowFn: AudioFilename,
  ): PairableRecording[] {
    // Rung 1: exact path
    const exact = recordings.filter((r) => r.storagePath === rowFn.full);
    if (exact.length > 0) return exact;

    // Rung 2: basename match (case-sensitive)
    const byBase = recordings.filter((r) => new AudioFilename(r.storagePath).base === rowFn.base);
    if (byBase.length > 0) return byBase;

    // Rung 3: case-insensitive basename
    const byBaseLower = recordings.filter(
      (r) => new AudioFilename(r.storagePath).baseLower === rowFn.baseLower,
    );
    if (byBaseLower.length > 0) return byBaseLower;

    // Rung 4: stem (basename without extension), case-insensitive
    const byStem = recordings.filter(
      (r) => new AudioFilename(r.storagePath).stemLower === rowFn.stemLower,
    );
    return byStem;
  }
}
