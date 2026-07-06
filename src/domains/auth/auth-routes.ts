const LOGIN_PATH = '/login';
const OAUTH_POPUP_PATH = '/oauth/popup';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export type OAuthProvider = 'google' | 'github';

export const authRoutes = {
  login(redirectTo?: string | null) {
    if (!redirectTo) {
      return LOGIN_PATH;
    }

    const searchParams = new URLSearchParams({
      redirectTo,
    });

    return `${LOGIN_PATH}?${searchParams.toString()}`;
  },
  isLoginPath(pathname: string) {
    return pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
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
