'use client';

import type { ReactNode } from 'react';

import QueryProvider from '@shared/components/query-provider';
import { Toaster } from '@shared/components/ui/sonner';
import { TooltipProvider } from '@shared/components/ui/tooltip';

import { ApiClientSetup } from './api-client-setup';
import ThemeProvider from './theme-provider';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ApiClientSetup />
      <TooltipProvider delay={300}>
        <QueryProvider>
          {children}
          <Toaster position="bottom-center" />
        </QueryProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
