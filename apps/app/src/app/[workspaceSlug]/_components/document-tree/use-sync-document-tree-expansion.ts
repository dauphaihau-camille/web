'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounceFn } from 'ahooks';
import { useEffect, useMemo, useRef } from 'react';

import {
  updateWorkspacePreference,
  useWorkspacePreferenceQuery,
  workspacePreferenceKeys,
  type WorkspacePreference,
} from '@/domains/workspace-preference';
import {
  type DocumentTreeScope,
  useDocumentTreeExpansionStore,
} from '@/stores/document-tree-expansion-store';

function normalizeDocumentIds(documentIds: string[]) {
  return [...new Set(
    documentIds
      .map((documentId) => documentId.trim())
      .filter((documentId) => documentId.length > 0),
  )];
}

function buildSignature(documentIds: string[]) {
  return normalizeDocumentIds(documentIds).join('|');
}

export function useSyncDocumentTreeExpansion(
  workspaceSlug: string,
  treeScope: DocumentTreeScope,
) {
  const queryClient = useQueryClient();
  const expandedByWorkspace = useDocumentTreeExpansionStore((state) => state.expandedByWorkspace);

  const hydratedWorkspaceScopeKeys = useDocumentTreeExpansionStore(
    (state) => state.hydratedWorkspaceScopeKeys,
  );

  const setExpandedDocumentIds = useDocumentTreeExpansionStore((state) => state.setExpandedDocumentIds);

  const markWorkspaceScopeHydrated = useDocumentTreeExpansionStore(
    (state) => state.markWorkspaceScopeHydrated,
  );

  const preferenceQuery = useWorkspacePreferenceQuery(workspaceSlug);
  const lastSyncedSignatureRef = useRef<string | null>(null);
  const workspaceScopeKey = `${workspaceSlug}:${treeScope}`;
  const isWorkspaceScopeHydrated = hydratedWorkspaceScopeKeys.includes(workspaceScopeKey);
  const expandedDocumentIds = expandedByWorkspace[workspaceSlug]?.[treeScope];

  const normalizedExpandedDocumentIds = useMemo(
    () => normalizeDocumentIds(expandedDocumentIds ?? []),
    [expandedDocumentIds],
  );

  const updatePreferenceMutation = useMutation({
    mutationFn: (documentIds: string[]) => {
      const currentPreference = queryClient.getQueryData<WorkspacePreference>(
        workspacePreferenceKeys.detail(workspaceSlug),
      );

      const currentExpandedByScope =
        useDocumentTreeExpansionStore.getState().expandedByWorkspace[workspaceSlug] ?? {};

      const expandedDocumentIdsByScope = Object.fromEntries(
        Object.entries(currentExpandedByScope).map(([scope, scopedDocumentIds]) => [
          scope,
          normalizeDocumentIds(scopedDocumentIds ?? []),
        ]),
      );

      return updateWorkspacePreference(workspaceSlug, {
        navigation: {
          expanded_document_ids_by_scope: {
            ...(currentPreference?.navigation.expanded_document_ids_by_scope ?? {}),
            ...expandedDocumentIdsByScope,
            [treeScope]: documentIds,
          },
        },
      });
    },
    onSuccess: (preference) => {
      queryClient.setQueryData<WorkspacePreference>(
        workspacePreferenceKeys.detail(workspaceSlug),
        preference,
      );
    },
  });

  const { run: schedulePreferenceSync, cancel: cancelPreferenceSync } = useDebounceFn(
    (documentIds: string[]) => {
      void updatePreferenceMutation.mutateAsync(documentIds);
    },
    { wait: 500 },
  );

  useEffect(() => {
    return () => {
      cancelPreferenceSync();
    };
  }, [cancelPreferenceSync]);

  useEffect(() => {
    if (!preferenceQuery.data || isWorkspaceScopeHydrated) {
      return;
    }

    const nextExpandedDocumentIds = normalizeDocumentIds(
      preferenceQuery.data.navigation.expanded_document_ids_by_scope[treeScope] ?? [],
    );

    setExpandedDocumentIds(workspaceSlug, treeScope, nextExpandedDocumentIds);
    markWorkspaceScopeHydrated(workspaceSlug, treeScope);
    lastSyncedSignatureRef.current = buildSignature(nextExpandedDocumentIds);
  }, [
    isWorkspaceScopeHydrated,
    markWorkspaceScopeHydrated,
    preferenceQuery.data,
    setExpandedDocumentIds,
    treeScope,
    workspaceSlug,
  ]);

  useEffect(() => {
    if (!isWorkspaceScopeHydrated) {
      return;
    }

    const nextSignature = buildSignature(normalizedExpandedDocumentIds);

    if (nextSignature === lastSyncedSignatureRef.current) {
      return;
    }

    lastSyncedSignatureRef.current = nextSignature;
    schedulePreferenceSync(normalizedExpandedDocumentIds);
  }, [
    isWorkspaceScopeHydrated,
    normalizedExpandedDocumentIds,
    schedulePreferenceSync,
  ]);

  return {
    isHydrated: isWorkspaceScopeHydrated,
    isLoading: preferenceQuery.isLoading && !isWorkspaceScopeHydrated,
  };
}
