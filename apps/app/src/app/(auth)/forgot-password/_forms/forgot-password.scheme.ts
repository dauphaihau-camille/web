import type { z } from 'zod';

import { forgotPasswordInputSchema } from '@/domains/auth';

export const forgotPasswordFormSchema = forgotPasswordInputSchema.extend({
  email: forgotPasswordInputSchema.shape.email.meta({
    title: 'Email',
  }),
});

export type ForgotPasswordFormValues = z.output<typeof forgotPasswordFormSchema>;
