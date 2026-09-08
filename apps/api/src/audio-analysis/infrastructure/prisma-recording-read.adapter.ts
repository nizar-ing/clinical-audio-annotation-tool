import type { PrismaClient } from '@prisma/client';
import type { RecordingReadModel, RecordingReadPort } from '../application/ports/recording-read.port.js';

export class PrismaRecordingReadAdapter implements RecordingReadPort {
  constructor(private readonly db: PrismaClient) {}

  async findById(recordingId: string): Promise<RecordingReadModel | null> {
    const r = await this.db.recording.findUnique({ where: { id: recordingId } });
    if (!r) return null;
    return {
      id: r.id,
      storageKey: r.storageKey,
      mimeType: r.mimeType,
      durationSeconds: r.durationSeconds,
      sampleRate: r.sampleRate,
      channels: r.channels,
      bitDepth: r.bitDepth,
      headerMetadata: r.headerMetadata,
    };
  }
}
