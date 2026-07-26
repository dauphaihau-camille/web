'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { useShareTab } from '../_hooks/use-share-tab';

type ShareTabContextValue = ReturnType<typeof useShareTab> & {
  copyLink: () => void | Promise<void>;
};

const ShareTabContext = createContext<ShareTabContextValue | null>(null);

export function ShareTabProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ShareTabContextValue;
}) {
  return (
    <ShareTabContext.Provider value={value}>
      {children}
    </ShareTabContext.Provider>
  );
}

export function useShareTabContext() {
  const shareTab = useContext(ShareTabContext);

  if (!shareTab) {
    throw new Error('useShareTabContext must be used within ShareTabProvider');
  }

  return shareTab;
}
