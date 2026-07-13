'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { RefreshCw, ServerCrash } from 'lucide-react';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@shared/components/ui/empty';
import { Button } from '@shared/components/ui/button';
import { authRoutes } from '@/domains/auth';

function isBackendUnavailableError(error: Error) {
  const message = error.message.toLowerCase();

  return (
    message.includes('fetch failed')
    || message.includes('econnrefused')
    || message.includes('network')
    || message.includes('timed out')
    || message.includes('socket')
  );
}

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentPath = `${pathname}${search ? `?${search}` : ''}`;
  const wakeHref = authRoutes.wake(currentPath);
  const isBackendUnavailable = isBackendUnavailableError(error);

  return (
    <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10 sm:px-6">
      <Empty className="max-w-xl rounded-2xl border border-border bg-background shadow-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ServerCrash />
          </EmptyMedia>
          <EmptyTitle className="text-base">
            {isBackendUnavailable ? 'Backend is unavailable' : 'This page could not be loaded'}
          </EmptyTitle>
          <EmptyDescription>
            {isBackendUnavailable
              ? 'Camille cannot reach the API right now. If the backend is sleeping, wake it up and we will bring you back here.'
              : 'Something went wrong while loading this workspace page. Try again first. If it keeps happening, wake the backend and retry.'}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-md gap-3">
          <Button
            type="button"
            className="w-full"
            onClick={() => reset()}
          >
            <RefreshCw />
            Try again
          </Button>
          <Button
            variant="outline"
            className="w-full"
            render={<Link href={wakeHref} />}
          >
            Wake backend
          </Button>
        </EmptyContent>
      </Empty>
    </section>
  );
}
