'use client';

import type { ReactNode } from 'react';

import QueryProvider from './query-provider';
import { Toaster } from './ui/sonner';
import ThemeProvider from './theme-provider';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <Toaster position="bottom-center" />
      </QueryProvider>
    </ThemeProvider>
  );
}
