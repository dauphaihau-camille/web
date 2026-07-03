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
import { useDocumentTreeExpansionStore } from '@/stores/document-tree-expansion-store';

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

export function useSyncDocumentTreeExpansion(workspaceSlug: string) {
  const queryClient = useQueryClient();
  const expandedByWorkspace = useDocumentTreeExpansionStore((state) => state.expandedByWorkspace);
  const hydratedWorkspaceIds = useDocumentTreeExpansionStore((state) => state.hydratedWorkspaceIds);
  const setExpandedDocumentIds = useDocumentTreeExpansionStore((state) => state.setExpandedDocumentIds);
  const markWorkspaceHydrated = useDocumentTreeExpansionStore((state) => state.markWorkspaceHydrated);
  const preferenceQuery = useWorkspacePreferenceQuery(workspaceSlug);
  const lastSyncedSignatureRef = useRef<string | null>(null);
  const isWorkspaceHydrated = hydratedWorkspaceIds.includes(workspaceSlug);
  const expandedDocumentIds = expandedByWorkspace[workspaceSlug];
  const normalizedExpandedDocumentIds = useMemo(
    () => normalizeDocumentIds(expandedDocumentIds ?? []),
    [expandedDocumentIds],
  );

  const updatePreferenceMutation = useMutation({
    mutationFn: (documentIds: string[]) =>
      updateWorkspacePreference(workspaceSlug, {
        navigation: {
          expanded_document_ids: documentIds,
        },
      }),
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
    if (!preferenceQuery.data || isWorkspaceHydrated) {
      return;
    }

    const nextExpandedDocumentIds = normalizeDocumentIds(
      preferenceQuery.data.navigation.expanded_document_ids,
    );

    setExpandedDocumentIds(workspaceSlug, nextExpandedDocumentIds);
    markWorkspaceHydrated(workspaceSlug);
    lastSyncedSignatureRef.current = buildSignature(nextExpandedDocumentIds);
  }, [
    isWorkspaceHydrated,
    markWorkspaceHydrated,
    preferenceQuery.data,
    setExpandedDocumentIds,
    workspaceSlug,
  ]);

  useEffect(() => {
    if (!isWorkspaceHydrated) {
      return;
    }

    const nextSignature = buildSignature(normalizedExpandedDocumentIds);

    if (nextSignature === lastSyncedSignatureRef.current) {
      return;
    }

    lastSyncedSignatureRef.current = nextSignature;
    schedulePreferenceSync(normalizedExpandedDocumentIds);
  }, [
    isWorkspaceHydrated,
    normalizedExpandedDocumentIds,
    schedulePreferenceSync,
  ]);

  return {
    isHydrated: isWorkspaceHydrated,
    isLoading: preferenceQuery.isLoading && !isWorkspaceHydrated,
  };
}
