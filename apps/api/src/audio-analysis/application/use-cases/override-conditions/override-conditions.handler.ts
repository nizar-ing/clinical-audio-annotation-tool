import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import type { ConditionsDto } from '../../dtos/conditions.dto.js';
import type { RecordingReadPort } from '../../ports/recording-read.port.js';
import type { RecordingConditionsRepositoryPort } from '../../ports/recording-conditions.repository.port.js';
import { toDto } from '../get-conditions/get-conditions.handler.js';
import type { OverrideConditionsCommand } from './override-conditions.command.js';

export class OverrideConditionsHandler {
  constructor(
    private readonly recordings: RecordingReadPort,
    private readonly conditions: RecordingConditionsRepositoryPort,
  ) {}

  async execute(cmd: OverrideConditionsCommand): Promise<ConditionsDto> {
    const recording = await this.recordings.findById(cmd.recordingId);
    if (!recording) throw new NotFoundException(`Recording ${cmd.recordingId} not found`);

    const existing = await this.conditions.findByRecordingId(cmd.recordingId);
    // PATCH is only meaningful after an initial analysis. Force the client to hit GET first.
    if (!existing) throw new NotFoundException(`No conditions recorded yet for ${cmd.recordingId}`);

    const patch: { overrideSpeechRateWpm?: number | null; overrideDistanceBucket?: string | null } = {};
    if (cmd.speechRateWpm !== undefined) patch.overrideSpeechRateWpm = cmd.speechRateWpm;
    if (cmd.distanceBucket !== undefined) patch.overrideDistanceBucket = cmd.distanceBucket;

    const updated = await this.conditions.updateOverrides(cmd.recordingId, patch);
    return toDto(recording, updated);
  }
}
