'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { authRoutes } from '@/domains/auth';

function shouldForceLightTheme(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return pathname === '/' || authRoutes.isLoginPath(pathname);
}

export default function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  const forcedTheme = shouldForceLightTheme(pathname) ? 'light' : props.forcedTheme;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
      forcedTheme={forcedTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
