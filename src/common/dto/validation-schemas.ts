import { z } from 'zod';

export const HeartbeatsSchema = z.object({
  heartbeats: z
    .array(
      z.object({
        time: z.number(),
        entity: z.string(),
        is_write: z.boolean(),
        lineno: z.number(),
        cursorpos: z.number(),
        lines_in_file: z.number(),
        alternate_project: z.string().optional(),
        git_branch: z.string().optional(),
        project_folder: z.string().optional(),
        project_root_count: z.number().optional(),
        language: z.string().optional(),
        category: z.enum(['debugging', 'ai coding', 'building', 'code reviewing']).optional(),
        ai_line_changes: z.number().optional(),
        human_line_changes: z.number().optional(),
        is_unsaved_entity: z.boolean().optional(),
      })
    )
    .min(1, 'At least one heartbeat is required'),
});

export const SummariesQuerySchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
  full: z.boolean().optional().default(false),
});

export const SignUpSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(50, 'Name cannot exceed 50 characters')
      .trim(),
    email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(100, 'Password cannot exceed 100 characters'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, 'You must agree to the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const SignInSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(50, 'Name cannot exceed 50 characters')
      .trim()
      .optional(),
    email: z.string().email('Please enter a valid email address').toLowerCase().trim().optional(),
  })
  .refine((data) => data.name || data.email, {
    message: 'At least one field must be provided',
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(100, 'Password cannot exceed 100 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type HeartbeatsInput = z.infer<typeof HeartbeatsSchema>;
export type SummariesQuery = z.infer<typeof SummariesQuerySchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
