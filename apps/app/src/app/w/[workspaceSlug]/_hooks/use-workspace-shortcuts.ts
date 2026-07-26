'use client';

import { useContext } from 'react';

import { WorkspaceShortcutsContext } from '../_components/workspace-shortcuts-provider';

export function useWorkspaceShortcuts() {
  const value = useContext(WorkspaceShortcutsContext);

  if (!value) {
    throw new Error('useWorkspaceShortcuts must be used within WorkspaceShortcutsProvider');
  }

  return value;
}
