'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import * as React from 'react';

type QueryProviderProps = {
  children: React.ReactNode;
};

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = React.useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: (failureCount, error) => {
            if (error instanceof HTTPError && error.response.status >= 400 && error.response.status < 500) {
              return false;
            }

            return failureCount < 1;
          },
          staleTime: 30_000,
        },
      },
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
