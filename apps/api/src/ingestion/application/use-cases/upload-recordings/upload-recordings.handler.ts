import { randomUUID } from 'crypto';
import { AudioFormat } from '../../../domain/value-objects/audio-format.vo.js';
import { RoutingPolicyDomainService } from '../../../../work-queue/domain/services/routing-policy.domain-service.js';
import type { RecordingRepositoryPort } from '../../ports/recording.repository.port.js';
import type { AudioStoragePort } from '../../ports/audio-storage.port.js';
import type { AudioProbePort } from '../../ports/audio-probe.port.js';
import type { UploadRecordingsCommand } from './upload-recordings.command.js';

export interface UploadResult {
  id: string;
  originalFilename: string;
  status: string;
  durationSeconds: number;
  error?: string;
}

export class UploadRecordingsHandler {
  constructor(
    private readonly recordings: RecordingRepositoryPort,
    private readonly storage: AudioStoragePort,
    private readonly probe: AudioProbePort,
  ) {}

  async execute(cmd: UploadRecordingsCommand): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of cmd.files) {
      try {
        const format = AudioFormat.fromMagicBytes(file.buffer.slice(0, 12));
        const id = randomUUID();
        const storageKey = await this.storage.put(`${id}.${format.extension}`, file.buffer);
        const meta = await this.probe.probe(storageKey);
        const status = RoutingPolicyDomainService.routeByDuration(meta.durationSeconds);

        const recording = await this.recordings.save({
          id,
          originalFilename: file.originalname,
          storageKey,
          mimeType: format.mimeType,
          sizeBytes: file.size,
          durationSeconds: meta.durationSeconds,
          sampleRate: meta.sampleRate,
          channels: meta.channels,
          bitDepth: meta.bitDepth,
          headerMetadata: null,
          status,
          annotator: '',
        });

        results.push({ id: recording.id, originalFilename: file.originalname, status, durationSeconds: meta.durationSeconds });
      } catch (err) {
        results.push({
          id: '',
          originalFilename: file.originalname,
          status: 'ERROR',
          durationSeconds: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}
