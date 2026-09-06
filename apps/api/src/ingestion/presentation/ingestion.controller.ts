import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../shared/infrastructure/http/async-handler.js';
import { ok, okList } from '../../shared/infrastructure/http/response-envelope.js';
import type { UploadRecordingsHandler } from '../application/use-cases/upload-recordings/upload-recordings.handler.js';
import type { ImportTranscriptsHandler } from '../application/use-cases/import-transcripts/import-transcripts.handler.js';
import type { PairImportRowHandler } from '../application/use-cases/pair-import-row/pair-import-row.handler.js';
import type { UnpairImportRowHandler } from '../application/use-cases/unpair-import-row/unpair-import-row.handler.js';
import type { RecordingRepositoryPort } from '../application/ports/recording.repository.port.js';
import type { ImportRowRepositoryPort } from '../application/ports/import-row.repository.port.js';

const upload = multer({ storage: multer.memoryStorage() });

interface IngestionDeps {
  uploadHandler: UploadRecordingsHandler;
  importHandler: ImportTranscriptsHandler;
  pairHandler: PairImportRowHandler;
  unpairHandler: UnpairImportRowHandler;
  recordings: RecordingRepositoryPort;
  importRows: ImportRowRepositoryPort;
}

export function createIngestionRouter(deps: IngestionDeps): Router {
  const router = Router();

  router.post(
    '/recordings',
    upload.array('files'),
    asyncHandler(async (req, res) => {
      const files = (req.files as Express.Multer.File[]) ?? [];
      const result = await deps.uploadHandler.execute({
        files: files.map((f) => ({ originalname: f.originalname, buffer: f.buffer, size: f.size })),
      });
      ok(res, result, 207);
    }),
  );

  router.get(
    '/recordings',
    asyncHandler(async (req, res) => {
      const status = typeof req.query['status'] === 'string' ? req.query['status'] : undefined;
      const list = await deps.recordings.findAll(status ? { status } : undefined);
      okList(
        res,
        list.map((r) => ({
          id: r.id,
          originalFilename: r.originalFilename,
          status: r.status,
          durationSeconds: r.durationSeconds,
          mimeType: r.mimeType,
          sizeBytes: r.sizeBytes,
          createdAt: r.createdAt,
        })),
        list.length,
      );
    }),
  );

  router.post(
    '/import-rows',
    asyncHandler(async (req, res) => {
      const rawJson = JSON.stringify(req.body);
      const result = await deps.importHandler.execute({ rawJson });
      ok(res, result, 207);
    }),
  );

  router.get(
    '/import-rows',
    asyncHandler(async (req, res) => {
      const matched =
        req.query['matched'] === 'true' ? true : req.query['matched'] === 'false' ? false : undefined;
      const list = await deps.importRows.findAll(matched !== undefined ? { matched } : undefined);
      okList(
        res,
        list.map((r) => ({
          id: r.id,
          path: r.path,
          label: r.label,
          matchedRecordingId: r.matchedRecordingId,
          errorCode: r.errorCode,
        })),
        list.length,
      );
    }),
  );

  router.put(
    '/import-rows/:id/pairing',
    asyncHandler(async (req, res) => {
      const { recordingId } = req.body as { recordingId: string };
      await deps.pairHandler.execute({ importRowId: String(req.params['id']), recordingId });
      res.status(204).end();
    }),
  );

  router.delete(
    '/import-rows/:id/pairing',
    asyncHandler(async (req, res) => {
      await deps.unpairHandler.execute({ importRowId: String(req.params['id']) });
      res.status(204).end();
    }),
  );

  return router;
}
