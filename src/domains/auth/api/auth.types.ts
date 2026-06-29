import type { z } from 'zod';

import type {
  currentUserSchema,
  loginInputSchema,
  loginResponseSchema,
} from './auth.schemas';

export type CurrentUser = z.infer<typeof currentUserSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
