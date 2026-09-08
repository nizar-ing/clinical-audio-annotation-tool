import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import { assertLegalTransition } from '../../../../ingestion/domain/value-objects/recording-status.vo.js';
import type { RecordingStatus } from '../../../../ingestion/domain/value-objects/recording-status.vo.js';
import type { RecordingStatusPort } from '../../ports/recording-status.port.js';
import type { UpdateStatusCommand } from './update-status.command.js';

export interface UpdateStatusResult {
  id: string;
  status: RecordingStatus;
}

export class UpdateStatusHandler {
  constructor(private readonly recordings: RecordingStatusPort) {}

  async execute(cmd: UpdateStatusCommand): Promise<UpdateStatusResult> {
    const current = await this.recordings.findStatusById(cmd.recordingId);
    if (!current) {
      throw new NotFoundException(`Recording ${cmd.recordingId} not found`);
    }

    assertLegalTransition(current.status, cmd.next);
    await this.recordings.updateStatus(cmd.recordingId, cmd.next);

    return { id: cmd.recordingId, status: cmd.next };
  }
}
