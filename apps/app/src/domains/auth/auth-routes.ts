import { publicEnv } from '@shared/lib/public-env';

const LOGIN_PATH = '/login';
const SIGNUP_PATH = '/signup';
const OAUTH_POPUP_PATH = '/oauth/popup';
const WAKE_PATH = '/wake';
const LOGGED_OUT_SEARCH_PARAM = 'loggedOut';
const apiBaseUrl = publicEnv.apiBaseUrl;

export type OAuthProvider = 'google' | 'github';

export const authRoutes = {
  loginAfterLogout() {
    const searchParams = new URLSearchParams({
      [LOGGED_OUT_SEARCH_PARAM]: '1',
    });

    return `${LOGIN_PATH}?${searchParams.toString()}`;
  },
  wake(nextPath?: string | null) {
    if (!nextPath) {
      return WAKE_PATH;
    }

    const searchParams = new URLSearchParams({
      next: nextPath,
    });

    return `${WAKE_PATH}?${searchParams.toString()}`;
  },
  login(redirectTo?: string | null) {
    if (!redirectTo) {
      return LOGIN_PATH;
    }

    const searchParams = new URLSearchParams({
      redirectTo,
    });

    return `${LOGIN_PATH}?${searchParams.toString()}`;
  },
  signup(redirectTo?: string | null) {
    if (!redirectTo) {
      return SIGNUP_PATH;
    }

    const searchParams = new URLSearchParams({
      redirectTo,
    });

    return `${SIGNUP_PATH}?${searchParams.toString()}`;
  },
  isLoginPath(pathname: string) {
    return pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
  },
  isSignupPath(pathname: string) {
    return pathname === SIGNUP_PATH || pathname.startsWith(`${SIGNUP_PATH}/`);
  },
  isAuthPath(pathname: string) {
    return this.isLoginPath(pathname) || this.isSignupPath(pathname);
  },
  oauthStart(provider: OAuthProvider, redirectTo?: string | null) {
    const path = `${apiBaseUrl ?? ''}/auth/oauth/${provider}`;

    if (!redirectTo) {
      return path;
    }

    const searchParams = new URLSearchParams({
      redirectTo,
    });

    return `${path}?${searchParams.toString()}`;
  },
  oauthPopup(redirectTo?: string | null) {
    if (!redirectTo) {
      return OAUTH_POPUP_PATH;
    }

    const searchParams = new URLSearchParams({
      redirectTo,
    });

    return `${OAUTH_POPUP_PATH}?${searchParams.toString()}`;
  },
} as const;

export function hasLoggedOutSearchParam(searchParams: { get(name: string): string | null }) {
  return searchParams.get(LOGGED_OUT_SEARCH_PARAM) === '1';
}

export function resolveWakeNextPath(
  nextPath?: string | null,
  fallbackPath = LOGIN_PATH,
) {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return fallbackPath;
  }

  return nextPath;
}
