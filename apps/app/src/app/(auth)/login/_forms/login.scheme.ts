import type { z } from 'zod';

import {
  emailAuthStartInputSchema,
  emailAuthVerifyInputSchema,
  loginInputSchema,
} from '@/domains/auth';

export const requestEmailCodeFormSchema = emailAuthStartInputSchema.extend({
  displayName: emailAuthStartInputSchema.shape.displayName.meta({
    title: 'Name',
  }),
  email: emailAuthStartInputSchema.shape.email.meta({
    title: 'Email',
  }),
});

export const verifyEmailCodeFormSchema = emailAuthVerifyInputSchema.extend({
  code: emailAuthVerifyInputSchema.shape.code.meta({
    title: 'Verification code',
  }),
});

export const passwordLoginFormSchema = loginInputSchema.extend({
  email: loginInputSchema.shape.email.meta({
    title: 'Email',
  }),
  password: loginInputSchema.shape.password.meta({
    title: 'Password',
  }),
});

export type RequestEmailCodeFormValues = z.output<typeof requestEmailCodeFormSchema>;
export type VerifyEmailCodeFormValues = z.output<typeof verifyEmailCodeFormSchema>;
export type PasswordLoginFormValues = z.output<typeof passwordLoginFormSchema>;
