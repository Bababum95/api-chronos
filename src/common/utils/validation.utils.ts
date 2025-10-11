import { z } from 'zod';

import { ValidationError } from '../types/api-response.type';

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
      field: i.path[0] as string,
    }));
    const error = new Error('ValidationError');
    (error as any).details = issues;
    throw error;
  }
  return result.data;
}

export function zodErrorToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
    field: i.path[0] as string,
  }));
}
