import type { ImportRow } from '../../domain/entities/import-row.entity.js';

export interface ImportRowRepositoryPort {
  save(row: { id: string; path: string; label: string; matchedRecordingId: string | null; errorCode: string | null }): Promise<ImportRow>;
  findById(id: string): Promise<ImportRow | null>;
  findAll(filters?: { matched?: boolean }): Promise<ImportRow[]>;
  updatePairing(id: string, matchedRecordingId: string | null): Promise<void>;
}
