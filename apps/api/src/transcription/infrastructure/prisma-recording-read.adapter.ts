import type { PrismaClient } from '@prisma/client';
import type { RecordingReadPort, TranscriptRecordingSummary } from '../application/ports/recording-read.port.js';

export class PrismaRecordingReadAdapter implements RecordingReadPort {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<TranscriptRecordingSummary | null> {
    const row = await this.db.recording.findUnique({
      where: { id },
      select: { id: true, storageKey: true, durationSeconds: true },
    });
    return row ?? null;
  }
}
