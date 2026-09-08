import type { Router } from 'express';
import { prisma } from '../shared/infrastructure/database/postgres/prisma.client.js';
import { PrismaQueueReadModel } from './infrastructure/adapters/prisma-queue.read-model.js';
import { PrismaRecordingStatusAdapter } from './infrastructure/adapters/prisma-recording-status.adapter.js';
import { ListQueueHandler } from './application/use-cases/list-queue/list-queue.handler.js';
import { UpdateStatusHandler } from './application/use-cases/update-status/update-status.handler.js';
import { createWorkQueueRouter } from './presentation/queue.controller.js';

export function createWorkQueueModule(): Router {
  const queueReadModel = new PrismaQueueReadModel(prisma);
  const statusAdapter = new PrismaRecordingStatusAdapter(prisma);
  const listHandler = new ListQueueHandler(queueReadModel);
  const updateStatusHandler = new UpdateStatusHandler(statusAdapter);
  return createWorkQueueRouter({ listHandler, updateStatusHandler });
}
