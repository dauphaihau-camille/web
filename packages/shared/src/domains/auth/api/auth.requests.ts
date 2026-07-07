import { apiPost, apiRequest } from '../../../lib/api-client';

import {
  currentUserApiSchema,
  emailAuthStartInputSchema,
  emailAuthStartResponseApiSchema,
  emailAuthVerifyInputSchema,
  loginInputSchema,
  loginResponseApiSchema,
} from './auth.schemas';
import type {
  CurrentUser,
  EmailAuthStartInput,
  EmailAuthStartResponse,
  EmailAuthVerifyInput,
  LoginInput,
  LoginResponse,
} from './auth.types';

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

export async function startEmailAuth(
  body: EmailAuthStartInput,
): Promise<EmailAuthStartResponse> {
  const payload = emailAuthStartInputSchema.parse(body);
  const response = await apiPost<
    unknown,
    {
      email: string;
      intent?: 'login' | 'signup';
      display_name?: string;
    }
  >('auth/email/start', {
    email: payload.email,
    intent: payload.intent,
    display_name: payload.displayName,
  });

  return emailAuthStartResponseApiSchema.parse(response);
}

export async function verifyEmailAuth(
  body: EmailAuthVerifyInput,
): Promise<LoginResponse> {
  const payload = emailAuthVerifyInputSchema.parse(body);
  const response = await apiPost<
    unknown,
    {
      challenge_id: string;
      code: string;
      intent?: 'login' | 'signup';
      display_name?: string;
    }
  >('auth/email/verify', {
    challenge_id: payload.challengeId,
    code: payload.code,
    intent: payload.intent,
    display_name: payload.displayName,
  });

  return loginResponseApiSchema.parse(response);
}

export async function logout(): Promise<void> {
  await apiRequest('auth/logout', {
    method: 'post',
  });
}
