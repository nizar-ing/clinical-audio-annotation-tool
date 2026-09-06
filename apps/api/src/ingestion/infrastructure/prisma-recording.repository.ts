import { Prisma, type PrismaClient, type Recording as PrismaRecordingModel, type RecordingStatus as PrismaRecordingStatus } from '@prisma/client';
import type { RecordingRepositoryPort } from '../application/ports/recording.repository.port.js';
import type { RecordingProps } from '../domain/entities/recording.entity.js';
import { Recording } from '../domain/entities/recording.entity.js';

type SaveInput = Omit<RecordingProps, 'createdAt'> & { id: string };

export class PrismaRecordingRepository implements RecordingRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async save(input: SaveInput): Promise<Recording> {
    const record = await this.db.recording.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        originalFilename: input.originalFilename,
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        durationSeconds: input.durationSeconds,
        sampleRate: input.sampleRate,
        channels: input.channels,
        bitDepth: input.bitDepth,
        headerMetadata: (input.headerMetadata ?? undefined) as Prisma.InputJsonValue | undefined,
        status: input.status as PrismaRecordingStatus,
        annotator: input.annotator,
      },
      update: {},
    });
    return this.toEntity(record);
  }

  async findById(id: string): Promise<Recording | null> {
    const record = await this.db.recording.findUnique({ where: { id } });
    return record ? this.toEntity(record) : null;
  }

  async findAll(filters?: { status?: string }): Promise<Recording[]> {
    const records = await this.db.recording.findMany({
      where: filters?.status ? { status: filters.status as PrismaRecordingStatus } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toEntity(r));
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.db.recording.update({
      where: { id },
      data: { status: status as PrismaRecordingStatus },
    });
  }

  private toEntity(r: PrismaRecordingModel): Recording {
    return Recording.create(r.id, {
      originalFilename: r.originalFilename,
      storageKey: r.storageKey,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      durationSeconds: r.durationSeconds,
      sampleRate: r.sampleRate,
      channels: r.channels,
      bitDepth: r.bitDepth,
      headerMetadata: r.headerMetadata as Record<string, unknown> | null,
      status: r.status,
      annotator: r.annotator,
      createdAt: r.createdAt,
    });
  }
}
