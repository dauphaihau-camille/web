'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DocumentTreeScope = 'private' | 'favorites' | 'shared' | `teamspace:${string}`;

type ExpandedByWorkspace = Record<string, Partial<Record<DocumentTreeScope, string[]>>>;

type DocumentTreeExpansionStore = {
  expandedByWorkspace: ExpandedByWorkspace;
  hydratedWorkspaceScopeKeys: string[];
  setExpandedDocumentIds: (
    workspaceSlug: string,
    treeScope: DocumentTreeScope,
    documentIds: string[],
  ) => void;
  toggleExpandedDocumentId: (
    workspaceSlug: string,
    treeScope: DocumentTreeScope,
    documentId: string,
  ) => void;
  markWorkspaceScopeHydrated: (
    workspaceSlug: string,
    treeScope: DocumentTreeScope,
  ) => void;
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
      hydratedWorkspaceScopeKeys: [],
      setExpandedDocumentIds: (workspaceSlug, treeScope, documentIds) => {
        set((state) => ({
          expandedByWorkspace: {
            ...state.expandedByWorkspace,
            [workspaceSlug]: {
              ...state.expandedByWorkspace[workspaceSlug],
              [treeScope]: normalizeDocumentIds(documentIds),
            },
          },
        }));
      },
      toggleExpandedDocumentId: (workspaceSlug, treeScope, documentId) => {
        set((state) => {
          const currentDocumentIds =
            state.expandedByWorkspace[workspaceSlug]?.[treeScope] ?? [];
          const nextDocumentIds = currentDocumentIds.includes(documentId)
            ? currentDocumentIds.filter((currentDocumentId) => currentDocumentId !== documentId)
            : [...currentDocumentIds, documentId];

          return {
            expandedByWorkspace: {
              ...state.expandedByWorkspace,
              [workspaceSlug]: {
                ...state.expandedByWorkspace[workspaceSlug],
                [treeScope]: normalizeDocumentIds(nextDocumentIds),
              },
            },
          };
        });
      },
      markWorkspaceScopeHydrated: (workspaceSlug, treeScope) => {
        const scopeKey = `${workspaceSlug}:${treeScope}`;

        set((state) => (
          state.hydratedWorkspaceScopeKeys.includes(scopeKey)
            ? state
            : {
              hydratedWorkspaceScopeKeys: [
                ...state.hydratedWorkspaceScopeKeys,
                scopeKey,
              ],
            }
        ));
      },
    }),
    {
      name: 'document-tree-expansion',
      version: 1,
      partialize: (state) => ({
        expandedByWorkspace: state.expandedByWorkspace,
      }),
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState;
        }

        const state = persistedState as {
          expandedByWorkspace?: Record<string, string[] | Partial<Record<DocumentTreeScope, string[]>>>;
        };

        if (!state.expandedByWorkspace) {
          return persistedState;
        }

        return {
          ...state,
          expandedByWorkspace: Object.fromEntries(
            Object.entries(state.expandedByWorkspace).map(([workspaceSlug, value]) => [
              workspaceSlug,
              Array.isArray(value) ? { private: normalizeDocumentIds(value) } : value,
            ]),
          ),
        };
      },
    },
  ),
);
