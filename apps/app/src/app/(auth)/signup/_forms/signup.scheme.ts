import type { z } from 'zod';

import { registerInputSchema } from '@/domains/auth';

export const signupFormSchema = registerInputSchema.extend({
  displayName: registerInputSchema.shape.displayName.meta({
    title: 'Name',
  }),
  email: registerInputSchema.shape.email.meta({
    title: 'Email',
  }),
  password: registerInputSchema.shape.password.meta({
    title: 'Password',
  }),
});

export type SignupFormValues = z.output<typeof signupFormSchema>;
