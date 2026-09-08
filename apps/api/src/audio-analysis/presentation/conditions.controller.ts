import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../shared/infrastructure/http/async-handler.js';
import { ok } from '../../shared/infrastructure/http/response-envelope.js';
import { DomainException } from '../../shared/domain/exceptions/domain.exception.js';
import type { GetConditionsHandler } from '../application/use-cases/get-conditions/get-conditions.handler.js';
import type { OverrideConditionsHandler } from '../application/use-cases/override-conditions/override-conditions.handler.js';

const OverrideBody = z.object({
  speechRateWpm: z.number().nonnegative().nullable().optional(),
  distanceBucket: z.enum(['close', 'normal', 'far']).nullable().optional(),
});

interface ConditionsDeps {
  getHandler: GetConditionsHandler;
  overrideHandler: OverrideConditionsHandler;
}

export function createConditionsRouter(deps: ConditionsDeps): Router {
  const router = Router();

  router.get(
    '/recordings/:id/conditions',
    asyncHandler(async (req, res) => {
      const dto = await deps.getHandler.execute({ recordingId: String(req.params['id']) });
      ok(res, dto);
    }),
  );

  router.patch(
    '/recordings/:id/conditions',
    asyncHandler(async (req, res) => {
      const parsed = OverrideBody.safeParse(req.body);
      if (!parsed.success) {
        throw new DomainException(
          parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        );
      }
      const dto = await deps.overrideHandler.execute({
        recordingId: String(req.params['id']),
        speechRateWpm: parsed.data.speechRateWpm,
        distanceBucket: parsed.data.distanceBucket,
      });
      ok(res, dto);
    }),
  );

  return router;
}
