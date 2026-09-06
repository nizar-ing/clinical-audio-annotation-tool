import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import type { ImportRowRepositoryPort } from '../../ports/import-row.repository.port.js';
import type { RecordingRepositoryPort } from '../../ports/recording.repository.port.js';
import type { UnpairImportRowCommand } from './unpair-import-row.command.js';

export class UnpairImportRowHandler {
  constructor(
    private readonly importRows: ImportRowRepositoryPort,
    private readonly recordings: RecordingRepositoryPort,
  ) {}

  async execute(cmd: UnpairImportRowCommand): Promise<void> {
    const row = await this.importRows.findById(cmd.importRowId);
    if (!row) throw new NotFoundException(`Import row ${cmd.importRowId} not found`);

    const previousRecordingId = row.matchedRecordingId;
    await this.importRows.updatePairing(cmd.importRowId, null);

    if (previousRecordingId) {
      await this.recordings.updateStatus(previousRecordingId, 'UNPAIRED');
    }
  }
}
