import { Router } from 'express';
import { asyncHandler } from '../../shared/infrastructure/http/async-handler.js';
import { ok, okList } from '../../shared/infrastructure/http/response-envelope.js';
import { DomainException } from '../../shared/domain/exceptions/domain.exception.js';
import { CreateSpanDto, UpdateSpanDto } from './dtos/create-span.dto.js';
import type { CreateSpanHandler } from '../application/use-cases/create-span/create-span.handler.js';
import type { UpdateSpanHandler } from '../application/use-cases/update-span/update-span.handler.js';
import type { DeleteSpanHandler } from '../application/use-cases/delete-span/delete-span.handler.js';
import type { AnnotationRepositoryPort } from '../application/ports/annotation.repository.port.js';
import type { AnnotationSpan } from '../domain/entities/annotation-span.entity.js';

interface AnnotationDeps {
  createHandler: CreateSpanHandler;
  updateHandler: UpdateSpanHandler;
  deleteHandler: DeleteSpanHandler;
  annotations: AnnotationRepositoryPort;
}

function toDto(span: AnnotationSpan) {
  return {
    id: span.id,
    transcriptId: span.transcriptId,
    spanType: span.spanType,
    startOffset: span.offsets.start,
    endOffset: span.offsets.end,
    anchorText: span.anchorText,
    attributes: span.attributes,
    needsReview: span.needsReview,
    createdAt: span.createdAt,
  };
}

export function createAnnotationRouter(deps: AnnotationDeps): Router {
  const router = Router();

  router.get(
    '/recordings/:id/annotations',
    asyncHandler(async (req, res) => {
      const spans = await deps.annotations.findByRecordingId(String(req.params['id']));
      okList(res, spans.map(toDto), spans.length);
    }),
  );

  router.post(
    '/recordings/:id/annotations',
    asyncHandler(async (req, res) => {
      const body = CreateSpanDto.safeParse(req.body);
      if (!body.success) {
        throw new DomainException(
          body.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        );
      }
      const span = await deps.createHandler.execute({
        recordingId: String(req.params['id']),
        ...body.data,
      });
      ok(res, toDto(span), 201);
    }),
  );

  router.patch(
    '/annotations/:id',
    asyncHandler(async (req, res) => {
      const body = UpdateSpanDto.safeParse(req.body);
      if (!body.success) {
        throw new DomainException(
          body.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        );
      }
      const span = await deps.updateHandler.execute({ id: String(req.params['id']), ...body.data });
      ok(res, toDto(span));
    }),
  );

  router.delete(
    '/annotations/:id',
    asyncHandler(async (req, res) => {
      await deps.deleteHandler.execute(String(req.params['id']));
      res.status(204).end();
    }),
  );

  return router;
}
