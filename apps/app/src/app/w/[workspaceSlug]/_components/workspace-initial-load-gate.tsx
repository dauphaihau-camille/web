'use client';

import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';

import LoadingFullPage from '@shared/components/loading-full-page';

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function WorkspaceInitialLoadGate({
  children,
}: {
  children: ReactNode;
}) {
  const isReady = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!isReady) {
    return <LoadingFullPage />;
  }

  return children;
}
