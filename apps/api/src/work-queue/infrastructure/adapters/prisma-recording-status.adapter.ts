import type { PrismaClient } from '@prisma/client';
import type { RecordingStatusPort } from '../../application/ports/recording-status.port.js';
import type { RecordingStatus } from '../../../ingestion/domain/value-objects/recording-status.vo.js';

export class PrismaRecordingStatusAdapter implements RecordingStatusPort {
  constructor(private readonly db: PrismaClient) {}

  async findStatusById(id: string): Promise<{ status: RecordingStatus } | null> {
    const row = await this.db.recording.findUnique({ where: { id }, select: { status: true } });
    return row ? { status: row.status as RecordingStatus } : null;
  }

  async updateStatus(id: string, status: RecordingStatus): Promise<void> {
    await this.db.recording.update({ where: { id }, data: { status } });
  }
}
