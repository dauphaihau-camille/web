'use client';

import { createThemeProvider } from '@shared/components/create-theme-provider';
import { authRoutes } from '@/domains/auth';

function shouldForceLightTheme(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return pathname === '/' || authRoutes.isAuthPath(pathname);
}

export default createThemeProvider(shouldForceLightTheme);
