import type { Router } from 'express';
import { prisma } from '../shared/infrastructure/database/postgres/prisma.client.js';
import { PrismaExportReadModel } from './infrastructure/adapters/prisma-export.read-model.js';
import { ExportGoldStandardHandler } from './application/use-cases/export-gold-standard/export-gold-standard.handler.js';
import { createExportRouter } from './presentation/export.controller.js';

export function createExportModule(): Router {
  const readModel = new PrismaExportReadModel(prisma);
  const handler = new ExportGoldStandardHandler(readModel);
  return createExportRouter(handler);
}
