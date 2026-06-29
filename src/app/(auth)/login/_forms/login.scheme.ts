import type { z } from 'zod';

import { loginInputSchema } from '@/domains/auth';

export const loginFormSchema = loginInputSchema.extend({
  email: loginInputSchema.shape.email.meta({
    title: 'Email',
  }),
  password: loginInputSchema.shape.password.min(8, 'Password must be at least 8 characters.'),
});

export type LoginFormValues = z.output<typeof loginFormSchema>;
