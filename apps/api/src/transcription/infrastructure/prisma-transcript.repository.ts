import type { PrismaClient, Transcript as PrismaTranscript } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { Transcript } from '../domain/entities/transcript.entity.js';
import type { AlignmentMethod, WordAlignment } from '../domain/value-objects/word-alignment.vo.js';
import type { TranscriptRepositoryPort } from '../application/ports/transcript.repository.port.js';

const ALIGNMENT_METHODS: AlignmentMethod[] = ['proportional', 'energy-gated', 'external', 'none'];

export class PrismaTranscriptRepository implements TranscriptRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async findByRecordingId(recordingId: string): Promise<Transcript | null> {
    const row = await this.db.transcript.findUnique({ where: { recordingId } });
    return row ? this.toEntity(row) : null;
  }

  async save(transcript: Transcript): Promise<Transcript> {
    // Prisma 7 requires JSON columns to receive a Prisma.InputJsonValue-shaped value.
    const wordTimingsJson =
      transcript.wordTimings === null
        ? Prisma.JsonNull
        : (transcript.wordTimings as unknown as Prisma.InputJsonValue);

    const row = await this.db.transcript.upsert({
      where: { recordingId: transcript.recordingId },
      create: {
        id: transcript.id,
        recordingId: transcript.recordingId,
        originalText: transcript.originalText,
        correctedText: transcript.correctedText,
        wordTimings: wordTimingsJson,
        alignmentMethod: transcript.alignmentMethod,
        werCached: transcript.werCached,
      },
      update: {
        // originalText intentionally omitted — the trigger forbids it, the port promises it.
        correctedText: transcript.correctedText,
        wordTimings: wordTimingsJson,
        alignmentMethod: transcript.alignmentMethod,
        werCached: transcript.werCached,
      },
    });
    return this.toEntity(row);
  }

  private toEntity(row: PrismaTranscript): Transcript {
    const method = ALIGNMENT_METHODS.includes(row.alignmentMethod as AlignmentMethod)
      ? (row.alignmentMethod as AlignmentMethod)
      : 'none';
    const timings = row.wordTimings === null ? null : (row.wordTimings as unknown as WordAlignment[]);

    return Transcript.create(row.id, {
      recordingId: row.recordingId,
      originalText: row.originalText,
      correctedText: row.correctedText,
      wordTimings: timings,
      alignmentMethod: method,
      werCached: row.werCached ?? 0,
      updatedAt: row.updatedAt,
    });
  }
}
