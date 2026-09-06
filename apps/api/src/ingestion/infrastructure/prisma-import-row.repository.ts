import type { PrismaClient, ImportRow as PrismaImportRowModel } from '@prisma/client';
import { ConflictException } from '../../shared/domain/exceptions/application.exception.js';
import type { ImportRowRepositoryPort } from '../application/ports/import-row.repository.port.js';
import { ImportRow } from '../domain/entities/import-row.entity.js';

export class PrismaImportRowRepository implements ImportRowRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async save(input: {
    id: string;
    path: string;
    label: string;
    matchedRecordingId: string | null;
    errorCode: string | null;
  }): Promise<ImportRow> {
    const record = await this.db.importRow.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        path: input.path,
        label: input.label,
        matchedRecordingId: input.matchedRecordingId,
        errorCode: input.errorCode,
      },
      update: {},
    });
    return this.toEntity(record);
  }

  async findById(id: string): Promise<ImportRow | null> {
    const record = await this.db.importRow.findUnique({ where: { id } });
    return record ? this.toEntity(record) : null;
  }

  async findAll(filters?: { matched?: boolean }): Promise<ImportRow[]> {
    const records = await this.db.importRow.findMany({
      where:
        filters?.matched !== undefined
          ? filters.matched
            ? { matchedRecordingId: { not: null } }
            : { matchedRecordingId: null }
          : undefined,
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r) => this.toEntity(r));
  }

  async updatePairing(id: string, matchedRecordingId: string | null): Promise<void> {
    try {
      await this.db.importRow.update({ where: { id }, data: { matchedRecordingId } });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw new ConflictException('Recording is already paired to another import row');
      }
      throw err;
    }
  }

  private toEntity(r: PrismaImportRowModel): ImportRow {
    return ImportRow.create(r.id, {
      path: r.path,
      label: r.label,
      matchedRecordingId: r.matchedRecordingId,
      errorCode: r.errorCode,
      createdAt: r.createdAt,
    });
  }
}
