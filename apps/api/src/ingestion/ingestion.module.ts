import type { Router } from 'express';
import { prisma } from '../shared/infrastructure/database/postgres/prisma.client.js';
import { PrismaRecordingRepository } from './infrastructure/prisma-recording.repository.js';
import { PrismaImportRowRepository } from './infrastructure/prisma-import-row.repository.js';
import { LocalDiskAudioStorage } from './infrastructure/local-disk-audio.storage.js';
import { FfprobeAudioProbe } from './infrastructure/ffprobe-audio.probe.js';
import { UploadRecordingsHandler } from './application/use-cases/upload-recordings/upload-recordings.handler.js';
import { ImportTranscriptsHandler } from './application/use-cases/import-transcripts/import-transcripts.handler.js';
import { PairImportRowHandler } from './application/use-cases/pair-import-row/pair-import-row.handler.js';
import { UnpairImportRowHandler } from './application/use-cases/unpair-import-row/unpair-import-row.handler.js';
import { createIngestionRouter } from './presentation/ingestion.controller.js';

export function createIngestionModule(): Router {
  const recordings = new PrismaRecordingRepository(prisma);
  const importRows = new PrismaImportRowRepository(prisma);
  const storage = new LocalDiskAudioStorage();
  const probe = new FfprobeAudioProbe();

  const uploadHandler = new UploadRecordingsHandler(recordings, storage, probe);
  const importHandler = new ImportTranscriptsHandler(importRows, recordings);
  const pairHandler = new PairImportRowHandler(importRows, recordings);
  const unpairHandler = new UnpairImportRowHandler(importRows, recordings);

  return createIngestionRouter({ uploadHandler, importHandler, pairHandler, unpairHandler, recordings, importRows });
}
