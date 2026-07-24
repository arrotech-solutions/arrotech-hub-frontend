import { z } from 'zod';

/**
 * Reusable zod schemas + field primitives shared across all forms. Keeping
 * them here means validation rules (and their messages) are consistent
 * everywhere instead of re-implemented per screen.
 */

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

/** Login accepts any non-empty password (strength is enforced at signup). */
export const loginPasswordSchema = z.string().min(1, 'Password is required');

/** Strong password used for registration / reset. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number');

export const nameSchema = z
  .string()
  .min(2, 'Please enter your name')
  .max(80, 'That name is too long');

export const orgNameSchema = z
  .string()
  .min(2, 'Organization name is too short')
  .max(80, 'Organization name is too long');

export const phoneSchema = z
  .string()
  .min(7, 'Enter a valid phone number')
  .regex(/^[+\d][\d\s-]{6,}$/, 'Enter a valid phone number');

// ── Form schemas ──────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
  rememberMe: z.boolean().optional(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const createOrganizationSchema = z.object({
  name: orgNameSchema,
});
export type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>;
