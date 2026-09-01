import type { z } from 'zod';

import { resetPasswordInputSchema } from '@/domains/auth';

export const resetPasswordFormSchema = resetPasswordInputSchema.pick({
  password: true,
}).extend({
  password: resetPasswordInputSchema.shape.password.meta({
    title: 'Password',
  }),
});

export type ResetPasswordFormValues = z.output<typeof resetPasswordFormSchema>;
