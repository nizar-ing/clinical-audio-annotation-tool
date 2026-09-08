import { Router } from 'express';
import { asyncHandler } from '../../shared/infrastructure/http/async-handler.js';
import { ok, okList } from '../../shared/infrastructure/http/response-envelope.js';
import { DomainException } from '../../shared/domain/exceptions/domain.exception.js';
import { UpdateStatusDto } from './dtos/update-status.dto.js';
import { QUEUE_SORTS } from '../application/queries/list-queue.query.js';
import type { QueueSort } from '../application/queries/list-queue.query.js';
import type { RecordingStatus } from '../../ingestion/domain/value-objects/recording-status.vo.js';
import type { ListQueueHandler } from '../application/use-cases/list-queue/list-queue.handler.js';
import type { UpdateStatusHandler } from '../application/use-cases/update-status/update-status.handler.js';

interface WorkQueueDeps {
  listHandler: ListQueueHandler;
  updateStatusHandler: UpdateStatusHandler;
}

export function createWorkQueueRouter(deps: WorkQueueDeps): Router {
  const router = Router();

  router.get(
    '/queue',
    asyncHandler(async (req, res) => {
      const statusParam =
        typeof req.query['status'] === 'string' ? req.query['status'] : 'QUEUED,IN_PROGRESS';
      const statuses = statusParam.split(',').filter(Boolean) as RecordingStatus[];

      const sortParam = typeof req.query['sort'] === 'string' ? req.query['sort'] : '-createdAt';
      const sort: QueueSort = (QUEUE_SORTS as readonly string[]).includes(sortParam)
        ? (sortParam as QueueSort)
        : '-createdAt';

      const limit = Number(req.query['limit'] ?? 50);
      const offset = Number(req.query['offset'] ?? 0);
      const minDuration =
        req.query['minDuration'] !== undefined ? Number(req.query['minDuration']) : undefined;
      const maxDuration =
        req.query['maxDuration'] !== undefined ? Number(req.query['maxDuration']) : undefined;

      const { items, total } = await deps.listHandler.execute({
        statuses,
        sort,
        limit,
        offset,
        minDuration,
        maxDuration,
      });

      okList(res, items, total);
    }),
  );

  router.patch(
    '/queue/:recordingId/status',
    asyncHandler(async (req, res) => {
      const body = UpdateStatusDto.safeParse(req.body);
      if (!body.success) {
        throw new DomainException(
          body.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        );
      }

      const result = await deps.updateStatusHandler.execute({
        recordingId: String(req.params['recordingId']),
        next: body.data.status,
      });

      ok(res, result);
    }),
  );

  return router;
}
