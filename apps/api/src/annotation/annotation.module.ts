import type { Router } from 'express';
import { prisma } from '../shared/infrastructure/database/postgres/prisma.client.js';
import { PrismaAnnotationRepository } from './infrastructure/adapters/prisma-annotation.repository.js';
import { CreateSpanHandler } from './application/use-cases/create-span/create-span.handler.js';
import { UpdateSpanHandler } from './application/use-cases/update-span/update-span.handler.js';
import { DeleteSpanHandler } from './application/use-cases/delete-span/delete-span.handler.js';
import { createAnnotationRouter } from './presentation/annotation.controller.js';

export function createAnnotationModule(): Router {
  const annotations = new PrismaAnnotationRepository(prisma);
  const createHandler = new CreateSpanHandler(annotations);
  const updateHandler = new UpdateSpanHandler(annotations);
  const deleteHandler = new DeleteSpanHandler(annotations);
  return createAnnotationRouter({ createHandler, updateHandler, deleteHandler, annotations });
}
