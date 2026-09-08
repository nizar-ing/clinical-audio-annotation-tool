import type { PrismaClient } from '@prisma/client';
import type { TranscriptReadModel, TranscriptReadPort } from '../application/ports/transcript-read.port.js';

export class PrismaTranscriptReadAdapter implements TranscriptReadPort {
  constructor(private readonly db: PrismaClient) {}

  async findByRecordingId(recordingId: string): Promise<TranscriptReadModel | null> {
    const t = await this.db.transcript.findUnique({ where: { recordingId } });
    return t ? { correctedText: t.correctedText } : null;
  }
}
