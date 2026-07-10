'use client';

import { useEffect } from 'react';

import { configureApiClient } from '@shared/lib/api-client';
import { authRoutes } from '@/domains/auth';

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  const redirectTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginUrl = authRoutes.isAuthPath(window.location.pathname)
    ? window.location.pathname
    : authRoutes.login(redirectTo);

  if (
    window.location.pathname === loginUrl
    && !window.location.search
    && !window.location.hash
  ) {
    return;
  }

  window.location.replace(loginUrl);
}

export function ApiClientSetup() {
  useEffect(() => {
    configureApiClient({
      onUnauthorized: redirectToLogin,
    });

    return () => {
      configureApiClient({
        onUnauthorized: null,
      });
    };
  }, []);

  return null;
}
