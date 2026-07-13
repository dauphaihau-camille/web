import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { publicEnv } from '@shared/lib/public-env';
import { workspaceRoutes } from '@shared/domains/workspace/workspace-routes';
import { authRoutes, hasLoggedOutSearchParam } from '@/domains/auth/auth-routes';
import { getPostLoginRedirectTarget } from '@/domains/auth/lib/post-login-redirect';

const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_NAME = 'refreshToken';
const AUTH_API_PATH = '/auth/me';
const API_REQUEST_TIMEOUT_MS = 2500;
const MARKETING_HOME_PATH = '/';
const WAKE_PATH = '/wake';
const OAUTH_POPUP_PATH = '/oauth/popup';
const NEXT_ASSET_PATH = '/_next';

export default async function proxy(request: NextRequest) {
  if (!shouldCheckBackendAvailability(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!(await isApiHealthy(request))) {
    return NextResponse.redirect(new URL(authRoutes.wake(getRequestedPath(request)), request.url));
  }

  if (!isAuthenticatedRedirectPage(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (hasLoggedOutSearchParam(request.nextUrl.searchParams)) {
    return NextResponse.next();
  }

  const isAuthenticated = await hasAuthenticatedSession(request);

  if (!isAuthenticated) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(getAuthenticatedRedirectPath(request), request.url));
}

export const config = {
  matcher: ['/', '/login', '/signup', '/workspace', '/:workspaceSlug', '/:workspaceSlug/:path*'],
};

function isAuthPage(pathname: string) {
  return authRoutes.isAuthPath(pathname);
}

function isWakePage(pathname: string) {
  return pathname === WAKE_PATH || pathname.startsWith(`${WAKE_PATH}/`);
}

function isOAuthPopupPage(pathname: string) {
  return pathname === OAUTH_POPUP_PATH || pathname.startsWith(`${OAUTH_POPUP_PATH}/`);
}

function isStaticAssetPath(pathname: string) {
  return pathname.startsWith(`${NEXT_ASSET_PATH}/`) || pathname.includes('.');
}

function shouldCheckBackendAvailability(pathname: string) {
  if (isWakePage(pathname) || isOAuthPopupPage(pathname) || isStaticAssetPath(pathname)) {
    return false;
  }

  return true;
}

function isAuthenticatedRedirectPage(pathname: string) {
  return pathname === MARKETING_HOME_PATH || isAuthPage(pathname);
}

function hasAuthCookies(request: NextRequest) {
  return request.cookies.has(ACCESS_COOKIE_NAME) || request.cookies.has(REFRESH_COOKIE_NAME);
}

function getRequestedPath(request: NextRequest) {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

function getAuthenticatedRedirectPath(request: NextRequest) {
  const requestedTarget = request.nextUrl.searchParams.get('redirectTo') ??
    request.nextUrl.searchParams.get('from');
  const redirectPath = getPostLoginRedirectTarget(requestedTarget);

  return isAuthPage(redirectPath) ? workspaceRoutes.entry() : redirectPath;
}

async function isApiHealthy(request: NextRequest) {
  const apiOrigin = publicEnv.apiOrigin;

  if (!apiOrigin) {
    return true;
  }

  try {
    const response = await fetch(`${apiOrigin}/health`, {
      headers: {
        accept: 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });

    return response.ok;
  }
  catch {
    return false;
  }
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
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });

    if (response.status === 401) {
      return false;
    }

    return response.ok;
  }
  catch {
    return false;
  }
}
