import { apiPost, apiRequest } from '@/lib/api-client';

import {
  currentUserApiSchema,
  loginInputSchema,
  loginResponseApiSchema,
} from './auth.schemas';
import type { CurrentUser, LoginInput, LoginResponse } from './auth.types';

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const response = await apiRequest('auth/me', {
    throwHttpErrors: false,
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to load the current user.');
  }

  const user = await response.json<unknown>();

  return currentUserApiSchema.parse(user);
}

export async function login(body: LoginInput): Promise<LoginResponse> {
  const payload = loginInputSchema.parse(body);
  const response = await apiPost<unknown, LoginInput>('auth/login', payload);

  return loginResponseApiSchema.parse(response);
}

export async function logout(): Promise<void> {
  await apiPost('auth/logout');
}
