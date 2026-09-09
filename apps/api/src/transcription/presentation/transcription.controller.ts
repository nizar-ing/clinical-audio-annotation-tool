import { Router } from 'express';
import { asyncHandler } from '../../shared/infrastructure/http/async-handler.js';
import { ok } from '../../shared/infrastructure/http/response-envelope.js';
import { DomainException } from '../../shared/domain/exceptions/domain.exception.js';
import { CreateTranscriptDto } from './dtos/create-transcript.dto.js';
import { UpdateCorrectedDto } from './dtos/update-corrected.dto.js';
import type { Transcript } from '../domain/entities/transcript.entity.js';
import type { GetTranscriptHandler } from '../application/use-cases/get-transcript/get-transcript.handler.js';
import type { CreateTranscriptHandler } from '../application/use-cases/create-transcript/create-transcript.handler.js';
import type { UpdateCorrectedTranscriptHandler, UpdateCorrectedResult } from '../application/use-cases/update-corrected-transcript/update-corrected-transcript.handler.js';

interface TranscriptionDeps {
  getHandler: GetTranscriptHandler;
  createHandler: CreateTranscriptHandler;
  updateHandler: UpdateCorrectedTranscriptHandler;
}

function toDto(t: Transcript) {
  return {
    id: t.id,
    recordingId: t.recordingId,
    originalText: t.originalText,
    correctedText: t.correctedText,
    wordTimings: t.wordTimings,
    alignmentMethod: t.alignmentMethod,
    werCached: t.werCached,
    updatedAt: t.updatedAt,
  };
}

export function createTranscriptionRouter(deps: TranscriptionDeps): Router {
  const router = Router();

  router.get(
    '/recordings/:id/transcript',
    asyncHandler(async (req, res) => {
      const t = await deps.getHandler.execute({ recordingId: String(req.params['id']) });
      ok(res, toDto(t));
    }),
  );

  router.post(
    '/recordings/:id/transcript',
    asyncHandler(async (req, res) => {
      const body = CreateTranscriptDto.safeParse(req.body);
      if (!body.success) {
        throw new DomainException(
          body.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        );
      }
      const t = await deps.createHandler.execute({
        recordingId: String(req.params['id']),
        originalText: body.data.originalText,
      });
      ok(res, toDto(t), 201);
    }),
  );

  router.patch(
    '/recordings/:id/transcript/corrected',
    asyncHandler(async (req, res) => {
      const body = UpdateCorrectedDto.safeParse(req.body);
      if (!body.success) {
        throw new DomainException(
          body.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        );
      }
      const result: UpdateCorrectedResult = await deps.updateHandler.execute({
        recordingId: String(req.params['id']),
        correctedText: body.data.correctedText,
      });
      res.status(200).json({
        data: toDto(result.transcript),
        meta: { reanchor: result.reanchor },
      });
    }),
  );

  return router;
}
