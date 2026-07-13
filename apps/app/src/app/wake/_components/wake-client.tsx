'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { publicEnv } from '@shared/lib/public-env';

const HEALTHCHECK_INTERVAL_MS = 3000;
const STATUS_MESSAGE_DELAY_MS = 45000;

function getHealthUrl() {
  if (publicEnv.apiOrigin) {
    return `${publicEnv.apiOrigin}/health`;
  }
  return '/health';
}

async function isBackendHealthy() {
  const response = await fetch(getHealthUrl(), {
    cache: 'no-store',
    credentials: 'include',
  });
  return response.ok;
}

export function WakeClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const isRedirectingRef = useRef(false);
  const [, setHasTakenLongerThanExpected] = useState(false);
  const [, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const longWaitTimer = window.setTimeout(() => {
      setHasTakenLongerThanExpected(true);
    }, STATUS_MESSAGE_DELAY_MS);

    async function checkHealthAndRedirect() {
      if (isRedirectingRef.current) {
        return;
      }

      try {
        const isHealthy = await isBackendHealthy();

        if (isHealthy) {
          isRedirectingRef.current = true;
          router.replace(nextPath);
          return;
        }

        setErrorMessage(null);
      }
      catch {
        setErrorMessage('Still starting. We will keep trying automatically.');
      }
    }

    void checkHealthAndRedirect();

    const intervalId = window.setInterval(() => {
      void checkHealthAndRedirect();
    }, HEALTHCHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(longWaitTimer);
    };
  }, [nextPath, router]);
  return null;
}
