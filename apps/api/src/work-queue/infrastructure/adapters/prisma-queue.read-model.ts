import type { PrismaClient, Prisma } from '@prisma/client';
import type { QueueReadPort, QueueItem } from '../../application/ports/queue.read.port.js';
import type { ListQueueQuery, QueueSort } from '../../application/queries/list-queue.query.js';
import type { RecordingStatus } from '../../../ingestion/domain/value-objects/recording-status.vo.js';

function toOrderBy(sort: QueueSort): Prisma.RecordingOrderByWithRelationInput {
  switch (sort) {
    case 'duration':
      return { durationSeconds: 'asc' };
    case '-duration':
      return { durationSeconds: 'desc' };
    case 'createdAt':
      return { createdAt: 'asc' };
    case '-createdAt':
      return { createdAt: 'desc' };
  }
}

function toWhere(query: ListQueueQuery): Prisma.RecordingWhereInput {
  const durationFilter: Prisma.FloatFilter = {};
  if (query.minDuration !== undefined) durationFilter.gte = query.minDuration;
  if (query.maxDuration !== undefined) durationFilter.lte = query.maxDuration;

  return {
    status: { in: query.statuses },
    ...(query.minDuration !== undefined || query.maxDuration !== undefined
      ? { durationSeconds: durationFilter }
      : {}),
  };
}

export class PrismaQueueReadModel implements QueueReadPort {
  constructor(private readonly db: PrismaClient) {}

  async list(query: ListQueueQuery): Promise<{ items: QueueItem[]; total: number }> {
    const where = toWhere(query);

    const [rows, total] = await this.db.$transaction([
      this.db.recording.findMany({
        where,
        include: { transcript: { select: { werCached: true } } },
        orderBy: toOrderBy(query.sort),
        take: query.limit,
        skip: query.offset,
      }),
      this.db.recording.count({ where }),
    ]);

    const items: QueueItem[] = rows.map((r) => ({
      id: r.id,
      originalFilename: r.originalFilename,
      storageKey: r.storageKey,
      status: r.status as RecordingStatus,
      durationSeconds: r.durationSeconds,
      annotator: r.annotator,
      werCached: r.transcript?.werCached ?? null,
      createdAt: r.createdAt,
    }));

    return { items, total };
  }
}
