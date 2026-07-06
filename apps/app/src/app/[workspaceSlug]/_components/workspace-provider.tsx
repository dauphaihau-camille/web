'use client';

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

type WorkspaceContextValue = {
  workspaceSlug: string;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  children,
  workspaceSlug,
}: {
  children: ReactNode;
  workspaceSlug: string;
}) {
  return (
    <WorkspaceContext.Provider value={{ workspaceSlug }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);

  if (!value) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }

  return value;
}

export function useOptionalWorkspace() {
  return useContext(WorkspaceContext);
}
