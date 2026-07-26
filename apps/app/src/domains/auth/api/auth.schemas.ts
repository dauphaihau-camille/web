import { z } from 'zod';

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
  status: z.string(),
  sessionId: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export const currentUserApiSchema = z.object({
  id: z.coerce.string(),
  email: z.email(),
  display_name: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  status: z.coerce.string(),
  session_id: z.coerce.string(),
  roles: z.array(z.coerce.string()).catch([]),
  permissions: z.array(z.coerce.string()).catch([]),
}).transform((user) => ({
  id: user.id,
  email: user.email,
  displayName: user.display_name ?? undefined,
  avatar: user.avatar ?? undefined,
  status: user.status,
  sessionId: user.session_id,
  roles: user.roles,
  permissions: user.permissions,
}));

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const emailAuthIntentSchema = z.enum(['login', 'signup']);

export const emailAuthStartInputSchema = z.object({
  email: z.email(),
  intent: emailAuthIntentSchema.optional(),
  displayName: z.string().trim().max(120).optional(),
});

export const emailAuthVerifyInputSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits.'),
  intent: emailAuthIntentSchema.optional(),
  displayName: z.string().trim().max(120).optional(),
});

export const emailAuthStartResponseSchema = z.object({
  challengeId: z.string(),
  expiresInSeconds: z.number().int().positive(),
});

export const emailAuthStartResponseApiSchema = z.object({
  challenge_id: z.coerce.string(),
  expires_in_seconds: z.coerce.number().int().positive(),
}).transform((response) => ({
  challengeId: response.challenge_id,
  expiresInSeconds: response.expires_in_seconds,
}));

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: currentUserSchema,
});

export const loginResponseApiSchema = z.object({
  access_token: z.coerce.string(),
  refresh_token: z.coerce.string(),
  user: currentUserApiSchema,
}).transform((response) => ({
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  user: response.user,
}));
