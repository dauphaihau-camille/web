import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authRoutes } from '@shared/domains/auth/auth-routes';
import { getPostLoginRedirectTarget } from '@shared/domains/auth/lib/post-login-redirect';
import { publicEnv } from '@shared/lib/public-env';
import { workspaceRoutes } from '@shared/domains/workspace/workspace-routes';

const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_NAME = 'refreshToken';
const AUTH_API_PATH = '/auth/me';
const MARKETING_HOME_PATH = '/';

function isAuthPage(pathname: string) {
  return authRoutes.isAuthPath(pathname);
}

function isAuthenticatedRedirectPage(pathname: string) {
  return pathname === MARKETING_HOME_PATH || isAuthPage(pathname);
}

function hasAuthCookies(request: NextRequest) {
  return request.cookies.has(ACCESS_COOKIE_NAME) || request.cookies.has(REFRESH_COOKIE_NAME);
}

function getAuthenticatedRedirectPath(request: NextRequest) {
  const requestedTarget = request.nextUrl.searchParams.get('redirectTo') ??
    request.nextUrl.searchParams.get('from');
  const redirectPath = getPostLoginRedirectTarget(requestedTarget);

  return isAuthPage(redirectPath) ? workspaceRoutes.entry() : redirectPath;
}

async function hasAuthenticatedSession(request: NextRequest) {
  if (!hasAuthCookies(request)) {
    return false;
  }

  const apiBaseUrl = publicEnv.apiBaseUrl;

  if (!apiBaseUrl) {
    return true;
  }

  try {
    const response = await fetch(`${apiBaseUrl}${AUTH_API_PATH}`, {
      headers: {
        accept: 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    if (response.status === 401) {
      return false;
    }

    return response.ok;
  }
  catch {
    return true;
  }
}

export default async function proxy(request: NextRequest) {
  if (!isAuthenticatedRedirectPage(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const isAuthenticated = await hasAuthenticatedSession(request);

  if (!isAuthenticated) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(getAuthenticatedRedirectPath(request), request.url));
}

export const config = {
  matcher: ['/', '/login', '/signup'],
};
