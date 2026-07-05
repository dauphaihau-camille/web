import type { z } from 'zod';

import type {
  currentUserSchema,
  emailAuthStartInputSchema,
  emailAuthStartResponseSchema,
  emailAuthVerifyInputSchema,
  loginInputSchema,
  loginResponseSchema,
} from './auth.schemas';

export type CurrentUser = z.infer<typeof currentUserSchema>;
export type EmailAuthStartInput = z.infer<typeof emailAuthStartInputSchema>;
export type EmailAuthStartResponse = z.infer<typeof emailAuthStartResponseSchema>;
export type EmailAuthVerifyInput = z.infer<typeof emailAuthVerifyInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
