import { GoldStandardAssembler } from '../../../domain/services/gold-standard.assembler.js';
import type { ExportRecord } from '../../../domain/value-objects/export-record.vo.js';
import type { ExportReadPort } from '../../ports/export.read.port.js';

export class ExportGoldStandardHandler {
  constructor(private readonly readModel: ExportReadPort) {}

  async *execute(): AsyncGenerator<ExportRecord> {
    const exportedAt = new Date();
    for await (const row of this.readModel.streamCompleted()) {
      yield GoldStandardAssembler.assemble(
        row.recording,
        row.transcript,
        row.conditions,
        row.spans,
        exportedAt,
      );
    }
  }
}
