import { z } from 'zod';

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  displayName: z.string().optional(),
  status: z.string(),
  sessionId: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export const currentUserApiSchema = z.object({
  id: z.coerce.string(),
  email: z.email(),
  display_name: z.string().optional(),
  status: z.coerce.string(),
  session_id: z.coerce.string(),
  roles: z.array(z.coerce.string()).catch([]),
  permissions: z.array(z.coerce.string()).catch([]),
}).transform((user) => ({
  id: user.id,
  email: user.email,
  displayName: user.display_name,
  status: user.status,
  sessionId: user.session_id,
  roles: user.roles,
  permissions: user.permissions,
}));

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

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
