'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { LoadingIcon } from '@shared/components/loading-icon';
import { buttonVariants } from '@shared/components/ui/button';
import { publicEnv } from '@shared/lib/public-env';
import { cn } from '@shared/lib/utils';

const HEALTHCHECK_INTERVAL_MS = 3000;
const HEALTHCHECK_TIMEOUT_MS = 3000;
const STATUS_MESSAGE_DELAY_MS = 45000;
const MAX_AUTO_RETRY_MS = 90000;
const TIMED_OUT_MESSAGE = 'Camille is still unavailable. Please retry in a moment.';

function getHealthUrl() {
  if (publicEnv.apiOrigin) {
    return `${publicEnv.apiOrigin}/health`;
  }
  return '/health';
}

async function isBackendHealthy(signal: AbortSignal) {
  const response = await fetch(getHealthUrl(), {
    cache: 'no-store',
    credentials: 'include',
    signal,
  });
  return response.ok;
}

type WakeClientProps = {
  nextPath: string;
  retryPath: string;
};

type WakeStatus = 'starting' | 'taking-longer' | 'timed-out';

export function WakeClient({ nextPath, retryPath }: WakeClientProps) {
  const router = useRouter();
  const isRedirectingRef = useRef(false);
  const [status, setStatus] = useState<WakeStatus>('starting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let retryTimerId: number | null = null;
    let requestTimeoutId: number | null = null;
    let activeController: AbortController | null = null;
    let isCancelled = false;
    let hasTimedOut = false;

    const longWaitTimerId = window.setTimeout(() => {
      if (!isCancelled && !hasTimedOut) {
        setStatus('taking-longer');
      }
    }, STATUS_MESSAGE_DELAY_MS);

    const maxAutoRetryTimerId = window.setTimeout(() => {
      hasTimedOut = true;
      activeController?.abort();
      setStatus('timed-out');
      setErrorMessage(TIMED_OUT_MESSAGE);
    }, MAX_AUTO_RETRY_MS);

    function clearRequestTimeout() {
      if (requestTimeoutId !== null) {
        window.clearTimeout(requestTimeoutId);
        requestTimeoutId = null;
      }
    }

    function scheduleRetry() {
      if (isCancelled || hasTimedOut || isRedirectingRef.current) {
        return;
      }

      retryTimerId = window.setTimeout(() => {
        void checkHealthAndRedirect();
      }, HEALTHCHECK_INTERVAL_MS);
    }

    async function checkHealthAndRedirect() {
      if (isRedirectingRef.current || isCancelled || hasTimedOut) {
        return;
      }

      try {
        activeController = new AbortController();
        requestTimeoutId = window.setTimeout(() => {
          activeController?.abort();
        }, HEALTHCHECK_TIMEOUT_MS);

        const isHealthy = await isBackendHealthy(activeController.signal);
        activeController = null;
        clearRequestTimeout();

        if (isHealthy) {
          isRedirectingRef.current = true;
          router.replace(nextPath);
          return;
        }

        setErrorMessage(null);
        scheduleRetry();
      }
      catch (error) {
        activeController = null;
        clearRequestTimeout();

        if (isCancelled || hasTimedOut) {
          return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          scheduleRetry();
          return;
        }

        setErrorMessage('Still starting. We will keep trying automatically.');
        scheduleRetry();
      }
    }

    void checkHealthAndRedirect();

    return () => {
      isCancelled = true;
      activeController?.abort();
      clearRequestTimeout();

      if (retryTimerId !== null) {
        window.clearTimeout(retryTimerId);
      }

      window.clearTimeout(longWaitTimerId);
      window.clearTimeout(maxAutoRetryTimerId);
    };
  }, [nextPath, router]);

  const description = status === 'timed-out'
    ? 'Automatic retries stopped after 90 seconds because the backend is still unavailable.'
    : status === 'taking-longer'
      ? 'This is taking longer than expected, but we are still checking automatically.'
      : 'The backend server is starting. This usually takes 20 to 60 seconds.';

  const isManualRetryAvailable = status === 'timed-out';

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg p-8 text-center">
        <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-5">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Waking up Camille
            </h1>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          {errorMessage
            ? (
              <p role="alert" className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
            )
            : null}
          {isManualRetryAvailable
            ? (
              <a
                href={retryPath}
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}
              >
                Retry now
              </a>
            )
            : (
              <span
                aria-disabled="true"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'pointer-events-none w-full gap-2 opacity-50',
                )}
              >
                <LoadingIcon className="size-4" />
                Retry now
              </span>
            )}
        </div>
      </section>
    </main>
  );
}
