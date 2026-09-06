import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import type { ImportRowRepositoryPort } from '../../ports/import-row.repository.port.js';
import type { RecordingRepositoryPort } from '../../ports/recording.repository.port.js';
import type { PairImportRowCommand } from './pair-import-row.command.js';

export class PairImportRowHandler {
  constructor(
    private readonly importRows: ImportRowRepositoryPort,
    private readonly recordings: RecordingRepositoryPort,
  ) {}

  async execute(cmd: PairImportRowCommand): Promise<void> {
    const row = await this.importRows.findById(cmd.importRowId);
    if (!row) throw new NotFoundException(`Import row ${cmd.importRowId} not found`);

    const recording = await this.recordings.findById(cmd.recordingId);
    if (!recording) throw new NotFoundException(`Recording ${cmd.recordingId} not found`);

    // If the row was previously matched to a different recording, revert that recording to UNPAIRED
    if (row.matchedRecordingId && row.matchedRecordingId !== cmd.recordingId) {
      await this.recordings.updateStatus(row.matchedRecordingId, 'UNPAIRED');
    }

    await this.importRows.updatePairing(cmd.importRowId, cmd.recordingId);
    await this.recordings.updateStatus(cmd.recordingId, 'QUEUED');
  }
}
