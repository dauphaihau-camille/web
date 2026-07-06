import type { z } from 'zod';

import {
  emailAuthStartInputSchema,
  emailAuthVerifyInputSchema,
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

export type RequestEmailCodeFormValues = z.output<typeof requestEmailCodeFormSchema>;
export type VerifyEmailCodeFormValues = z.output<typeof verifyEmailCodeFormSchema>;
