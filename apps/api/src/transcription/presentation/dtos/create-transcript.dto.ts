import { z } from 'zod';

export const CreateTranscriptDto = z.object({
  originalText: z.string().min(1),
});
