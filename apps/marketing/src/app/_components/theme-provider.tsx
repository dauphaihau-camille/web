'use client';

import { createThemeProvider } from '@shared/components/create-theme-provider';

function shouldForceLightTheme(pathname: string | null) {
  if (!pathname) {
    return false;
  }
  return pathname === '/' || pathname === '/login' || pathname === '/signup';
}

export default createThemeProvider(shouldForceLightTheme);
