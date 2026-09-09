import { z } from 'zod';

export const UpdateCorrectedDto = z.object({
  correctedText: z.string(),
});
