import type { z } from 'zod';

import type {
  currentUserSchema,
  emailAuthIntentSchema,
  emailAuthStartInputSchema,
  emailAuthStartResponseSchema,
  emailAuthVerifyInputSchema,
  forgotPasswordInputSchema,
  loginInputSchema,
  loginResponseSchema,
  registerInputSchema,
  resetPasswordInputSchema,
  verifyResetPasswordTokenInputSchema,
} from './auth.schemas';

export type CurrentUser = z.infer<typeof currentUserSchema>;
export type EmailAuthIntent = z.infer<typeof emailAuthIntentSchema>;
export type EmailAuthStartInput = z.infer<typeof emailAuthStartInputSchema>;
export type EmailAuthStartResponse = z.infer<typeof emailAuthStartResponseSchema>;
export type EmailAuthVerifyInput = z.infer<typeof emailAuthVerifyInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
export type VerifyResetPasswordTokenInput = z.infer<typeof verifyResetPasswordTokenInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
