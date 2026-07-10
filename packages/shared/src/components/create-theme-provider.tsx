'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type ShouldForceLightTheme = (pathname: string | null) => boolean;

function shouldBypassThemeProvider(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return pathname === '/share' || pathname.startsWith('/share/');
}

export function createThemeProvider(
  shouldForceLightTheme: ShouldForceLightTheme,
) {
  return function ThemeProvider({
    children,
    ...props
  }: React.ComponentProps<typeof NextThemesProvider>) {
    const pathname = usePathname();

    if (shouldBypassThemeProvider(pathname)) {
      return children;
    }

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
  };
}
