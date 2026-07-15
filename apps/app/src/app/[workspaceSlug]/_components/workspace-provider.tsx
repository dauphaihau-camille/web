'use client';

import { useMutation } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect } from 'react';

import { markWorkspaceAsLastActive } from '@/domains/workspace-preference';

type WorkspaceContextValue = {
  workspaceSlug: string;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
let lastMarkedWorkspaceSlug: string | null = null;
let pendingWorkspaceSlug: string | null = null;

export function WorkspaceProvider({
  children,
  workspaceSlug,
}: {
  children: ReactNode;
  workspaceSlug: string;
}) {
  const { mutateAsync } = useMutation({
    mutationFn: markWorkspaceAsLastActive,
  });

  useEffect(() => {
    if (
      workspaceSlug === lastMarkedWorkspaceSlug
      || workspaceSlug === pendingWorkspaceSlug
    ) {
      return;
    }

    pendingWorkspaceSlug = workspaceSlug;

    void mutateAsync(workspaceSlug)
      .then(() => {
        lastMarkedWorkspaceSlug = workspaceSlug;
      })
      .finally(() => {
        if (pendingWorkspaceSlug === workspaceSlug) {
          pendingWorkspaceSlug = null;
        }
      });
  }, [mutateAsync, workspaceSlug]);

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
