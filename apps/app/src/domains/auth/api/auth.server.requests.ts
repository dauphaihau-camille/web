import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { apiServerRequest } from '@shared/lib/api-server';
import { logger } from '@shared/lib/server-logger';

import { authRoutes } from '../auth-routes';
import { currentUserApiSchema } from './auth.schemas';
import type { CurrentUser } from './auth.types';

const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_NAME = 'refreshToken';

async function buildCurrentUserRequestError(response: Response) {
  const responseBody = await response.text().catch(() => '');
  const trimmedBody = responseBody.trim();
  const details = trimmedBody ? ` Body: ${trimmedBody}` : '';

  return new Error(`Failed to load the current user. Status: ${response.status}.${details}`);
}

export async function getCurrentUserServer(): Promise<CurrentUser | null> {
  const response = await apiServerRequest('auth/me');

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw await buildCurrentUserRequestError(response);
  }

  const user = await response.json();

  return currentUserApiSchema.parse(user);
}

export async function requireCurrentUserServer(redirectTo: string): Promise<void> {
  const startedAt = Date.now();
  const hasSession = await hasCurrentUserSessionServer();

  if (!hasSession) {
    logger.warn({
      authGuard: {
        hasSession,
        durationMs: Date.now() - startedAt,
        redirectTo,
      },
    }, 'Missing current user session on the app server');

    redirect(authRoutes.login(redirectTo));
  }

  logger.info({
    authGuard: {
      hasSession,
      durationMs: Date.now() - startedAt,
      redirectTo,
    },
  }, 'Completed current user session check on the app server');
}

async function hasCurrentUserSessionServer() {
  const cookieStore = await cookies();

  return cookieStore.has(ACCESS_COOKIE_NAME) || cookieStore.has(REFRESH_COOKIE_NAME);
}
