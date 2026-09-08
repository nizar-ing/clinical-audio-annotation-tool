import { z } from 'zod';

export const UpdateStatusDto = z.object({
  status: z.enum(['UPLOADED', 'REJECTED_TOO_SHORT', 'UNPAIRED', 'QUEUED', 'IN_PROGRESS', 'DONE']),
});
