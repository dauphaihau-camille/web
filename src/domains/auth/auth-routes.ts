const LOGIN_PATH = '/login';

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
} as const;
