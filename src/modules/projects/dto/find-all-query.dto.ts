import { z } from 'zod';

export const FindAllProjectsQuerySchema = z.object({
  page: z.preprocess((val) => Number(val), z.number().int().positive().default(1)).optional(),
  limit: z.preprocess((val) => Number(val), z.number().int().nonnegative().default(0)).optional(),
  root: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true' || val === '1') return true;
        if (val.toLowerCase() === 'false' || val === '0') return false;
      }
      return val;
    }, z.boolean())
    .optional(),
});

export type FindAllProjectsQuery = z.infer<typeof FindAllProjectsQuerySchema>;
