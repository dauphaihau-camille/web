'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DocumentTreeExpansionStore = {
  expandedByWorkspace: Record<string, string[]>;
  hydratedWorkspaceIds: string[];
  setExpandedDocumentIds: (workspaceSlug: string, documentIds: string[]) => void;
  toggleExpandedDocumentId: (workspaceSlug: string, documentId: string) => void;
  markWorkspaceHydrated: (workspaceSlug: string) => void;
};

function normalizeDocumentIds(documentIds: string[]) {
  return [...new Set(
    documentIds
      .map((documentId) => documentId.trim())
      .filter((documentId) => documentId.length > 0),
  )];
}

export const useDocumentTreeExpansionStore = create<DocumentTreeExpansionStore>()(
  persist(
    (set) => ({
      expandedByWorkspace: {},
      hydratedWorkspaceIds: [],
      setExpandedDocumentIds: (workspaceSlug, documentIds) => {
        set((state) => ({
          expandedByWorkspace: {
            ...state.expandedByWorkspace,
            [workspaceSlug]: normalizeDocumentIds(documentIds),
          },
        }));
      },
      toggleExpandedDocumentId: (workspaceSlug, documentId) => {
        set((state) => {
          const currentDocumentIds = state.expandedByWorkspace[workspaceSlug] ?? [];
          const nextDocumentIds = currentDocumentIds.includes(documentId)
            ? currentDocumentIds.filter((currentDocumentId) => currentDocumentId !== documentId)
            : [...currentDocumentIds, documentId];

          return {
            expandedByWorkspace: {
              ...state.expandedByWorkspace,
              [workspaceSlug]: normalizeDocumentIds(nextDocumentIds),
            },
          };
        });
      },
      markWorkspaceHydrated: (workspaceSlug) => {
        set((state) => (
          state.hydratedWorkspaceIds.includes(workspaceSlug)
            ? state
            : {
              hydratedWorkspaceIds: [...state.hydratedWorkspaceIds, workspaceSlug],
            }
        ));
      },
    }),
    {
      name: 'document-tree-expansion',
      partialize: (state) => ({
        expandedByWorkspace: state.expandedByWorkspace,
      }),
    },
  ),
);
