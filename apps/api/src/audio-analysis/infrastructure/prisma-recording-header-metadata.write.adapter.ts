import { Prisma, type PrismaClient } from '@prisma/client';
import type { RecordingHeaderMetadataWritePort } from '../application/ports/recording-header-metadata.write.port.js';

export class PrismaRecordingHeaderMetadataWriteAdapter implements RecordingHeaderMetadataWritePort {
  constructor(private readonly db: PrismaClient) {}

  async update(recordingId: string, headerMetadata: unknown): Promise<void> {
    await this.db.recording.update({
      where: { id: recordingId },
      data: { headerMetadata: headerMetadata as Prisma.InputJsonValue },
    });
  }
}
