import { z } from 'zod';

export const CreateSpanDto = z.object({
  spanType: z.string(),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(1),
  anchorText: z.string().min(1),
  attributes: z.record(z.string(), z.unknown()),
});

export const UpdateSpanDto = z.object({
  startOffset: z.number().int().min(0).optional(),
  endOffset: z.number().int().min(1).optional(),
  anchorText: z.string().min(1).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});
