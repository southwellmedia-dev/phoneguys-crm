import { z } from 'zod';
import { UserRole } from '@/lib/types/database.types';

/**
 * Validation schema for inviting a new user
 */
export const inviteUserSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  full_name: z.string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters'),
  role: z.enum(['admin', 'manager', 'technician'] as const, {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
});

/**
 * Validation schema for updating user information
 */
export const updateUserSchema = z.object({
  full_name: z.string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters')
    .optional(),
  role: z.enum(['admin', 'manager', 'technician'] as const, {
    errorMap: () => ({ message: 'Please select a valid role' })
  }).optional(),
  is_active: z.boolean().optional(),
});

/**
 * Validation schema for user profile updates (self-service)
 */
export const updateProfileSchema = z.object({
  full_name: z.string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters'),
});

/**
 * Validation schema for password setup during onboarding
 */
export const setPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type exports for use in components
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;