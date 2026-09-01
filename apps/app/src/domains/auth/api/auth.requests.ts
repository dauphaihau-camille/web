import { apiPost, apiRequest } from '@shared/lib/api-client';

import {
  currentUserApiSchema,
  emailAuthStartInputSchema,
  emailAuthStartResponseApiSchema,
  emailAuthVerifyInputSchema,
  forgotPasswordInputSchema,
  loginInputSchema,
  loginResponseApiSchema,
  registerInputSchema,
  resetPasswordInputSchema,
  verifyResetPasswordTokenInputSchema,
} from './auth.schemas';
import type {
  CurrentUser,
  EmailAuthStartInput,
  EmailAuthStartResponse,
  EmailAuthVerifyInput,
  ForgotPasswordInput,
  LoginInput,
  LoginResponse,
  RegisterInput,
  ResetPasswordInput,
  VerifyResetPasswordTokenInput,
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

export async function register(body: RegisterInput): Promise<LoginResponse> {
  const payload = registerInputSchema.parse(body);
  const response = await apiPost<
    unknown,
    {
      email: string;
      password: string;
      display_name: string;
    }
  >('auth/register', {
    email: payload.email,
    password: payload.password,
    display_name: payload.displayName,
  });

  return loginResponseApiSchema.parse(response);
}

export async function forgotPassword(body: ForgotPasswordInput): Promise<void> {
  const payload = forgotPasswordInputSchema.parse(body);

  await apiRequest('auth/forgot-password', {
    json: {
      email: payload.email,
      redirect_to: payload.redirectTo,
    },
    method: 'post',
  });
}

export async function verifyResetPasswordToken(
  body: VerifyResetPasswordTokenInput,
): Promise<void> {
  const payload = verifyResetPasswordTokenInputSchema.parse(body);
  const searchParams = new URLSearchParams({
    token: payload.token,
    type: 'reset_password',
  });

  await apiRequest(`auth/verify-token?${searchParams.toString()}`);
}

export async function resetPassword(body: ResetPasswordInput): Promise<LoginResponse> {
  const payload = resetPasswordInputSchema.parse(body);
  const searchParams = new URLSearchParams({
    token: payload.token,
  });
  const response = await apiPost<
    unknown,
    {
      password: string;
    }
  >(`auth/reset-password?${searchParams.toString()}`, {
    password: payload.password,
  });

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
    keepalive: true,
    method: 'post',
  });
}
