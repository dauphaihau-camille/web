'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import {
  archiveDocument,
  documentDetailQueryOptions,
  useArchiveSubdocumentMutation,
  documentKeys,
  restoreDocument,
  setRecentWorkspaceDocumentId,
  type Document,
  updateDocument,
  useCreateSubdocumentMutation,
} from '@/domains/document';
import { getWorkspaceBlockLimitReachedData } from '@/domains/subscription';
import { workspaceRoutes } from '@/domains/workspace';
import { hasMeaningfulContent } from '@shared/components/editor/has-meaningful-content';
import { updateCachedNavigationContentStatus } from '@/domains/document/cache/document-query-cache';

import { useLatestWinsSaveQueue } from './use-latest-wins-save-queue';
import { useDocumentDraftPersistence } from './use-document-draft-persistence';
import type { CommandUndoMetadata } from './use-document-session-undo-redo';

type UseDocumentEditorActionsOptions = {
  collaborationEnabled?: boolean;
  document: Document;
  registerCommandUndoMetadata?: (metadata: CommandUndoMetadata) => void;
  workspaceSlug: string;
  onRestoreDraft: (content: unknown[]) => void;
};

type CreateSubdocumentInput = {
  anchorBlockId?: string;
  slashCommandText?: string;
  content?: unknown[];
};

function mergeDocumentWithCachedDetail(
  nextDocument: Document,
  cachedDocument?: Document,
): Document {
  return {
    ...(cachedDocument ?? {}),
    ...nextDocument,
    breadcrumb: nextDocument.breadcrumb ?? cachedDocument?.breadcrumb,
  };
}

export function useDocumentEditorActions({
  collaborationEnabled = false,
  document,
  registerCommandUndoMetadata,
  workspaceSlug,
  onRestoreDraft,
}: UseDocumentEditorActionsOptions) {
  const queryClient = useQueryClient();
  const documentId = document.id;
  const shouldSkipContentSaveRef = useRef(false);
  const latestDocumentVersionRef = useRef(document.version);
  const hasPendingLocalPersistenceRef = useRef(false);

  useEffect(() => {
    latestDocumentVersionRef.current = document.version;
  }, [document.version]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingLocalPersistenceRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const syncLatestDocumentVersion = useCallback(() => {
    const latestDocument =
      queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ?? document;

    latestDocumentVersionRef.current = latestDocument.version;
    return latestDocument.version;
  }, [document, documentId, queryClient]);

  const draftPersistence = useDocumentDraftPersistence({
    enabled: !collaborationEnabled,
    document: {
      ...document,
      version: latestDocumentVersionRef.current,
    },
    workspaceSlug,
    onRestoreDraft,
  });

  const syncDocumentContentCache = (nextDocument: Document) => {
    const cachedDocument =
      queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ??
      queryClient.getQueryData<Document>(documentKeys.detail(document.public_id));
    const mergedDocument = mergeDocumentWithCachedDetail(
      nextDocument,
      cachedDocument,
    );

    queryClient.setQueryData<Document>(documentKeys.detail(documentId), mergedDocument);
    queryClient.setQueryData<Document>(
      documentKeys.detail(mergedDocument.public_id),
      mergedDocument,
    );
    updateCachedNavigationContentStatus(
      queryClient,
      workspaceSlug,
      documentId,
      hasMeaningfulContent(mergedDocument.content),
    );
  };

  const updateContentMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateDocument>[1]) =>
      updateDocument(documentId, input),
    onSuccess: async (documentUpdated, variables) => {
      if (variables.content !== undefined) {
        updateCachedNavigationContentStatus(
          queryClient,
          workspaceSlug,
          documentId,
          hasMeaningfulContent(documentUpdated.content),
        );
      }

      queryClient.setQueryData<Document>(
        documentKeys.detail(documentId),
        (currentDocument) => ({
          ...(currentDocument ?? documentUpdated),
          ...documentUpdated,
          ...(variables.content !== undefined
            ? { content: variables.content }
            : {}),
        }),
      );

      await queryClient.invalidateQueries({
        queryKey: documentKeys.tree(workspaceSlug),
      });
    },
  });

  const {
    awaitIdle: awaitContentSaveIdle,
    enqueue: queueContentSave, 
  } = useLatestWinsSaveQueue<Document['content'], Record<string, never>>({
    initialMeta: {},
    onFlush: async (nextContent) => {
      if (shouldSkipContentSaveRef.current) {
        return;
      }

      await draftPersistence.markRemoteSaveStarted();

      const latestDocument =
        queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ?? document;

      syncDocumentContentCache({
        ...latestDocument,
        content: nextContent,
      });

      try {
        const updatedDocument = await updateContentMutation.mutateAsync({
          version: latestDocument.version,
          content: nextContent,
        });

        latestDocumentVersionRef.current = updatedDocument.version;
        await draftPersistence.markRemoteSaveSucceeded();
        syncDocumentContentCache({
          ...updatedDocument,
          content: nextContent,
        });
      }
      catch (error) {
        await draftPersistence.markRemoteSaveFailed(error);
        throw error;
      }
    },
  });

  const createSubdocumentMutation = useCreateSubdocumentMutation({
    document,
    workspaceSlug,
  });

  type ArchiveSubdocumentMutationContext = {
    toastId: string;
  };

  const archiveSubdocumentMutation = useArchiveSubdocumentMutation<
    Document,
    ArchiveSubdocumentMutationContext
  >({
    document,
    workspaceSlug,
    onMutate: async ({ subdocumentId }) => {
      const toastId = `archive-subdoc:${subdocumentId}`;
      toast('Moved to trash', { id: toastId });

      return {
        toastId,
      };
    },
    onError: (_error, _variables, context) => {
      toast('Failed to move doc to trash', {
        id: context?.toastId,
      });
    },
  });

  useEffect(() => {
    setRecentWorkspaceDocumentId(workspaceSlug, documentId);
  }, [documentId, workspaceSlug]);

  const createSubdocument = async (input?: CreateSubdocumentInput) => {
    const result = await createSubdocumentMutation.mutateAsync(input)
      .catch((error: unknown) => {
        const blockLimitError = getWorkspaceBlockLimitReachedData(error);

        if (blockLimitError) {
          toast('Block limit reached', {
            action: {
              label: 'Upgrade',
              onClick: () => {
                window.location.assign(
                  workspaceRoutes.settingsBilling(workspaceSlug),
                );
              },
            },
          });
        }

        throw error;
      });

    if (input?.anchorBlockId) {
      registerCommandUndoMetadata?.({
        anchorBlockId: input.anchorBlockId,
        type: 'createSubdocument',
      });
    }

    return result.child_document;
  };

  const archiveSubdocument = async (subdocumentId: string, content?: unknown[]) => {
    shouldSkipContentSaveRef.current = true;

    try {
      await awaitContentSaveIdle();
      registerCommandUndoMetadata?.({
        subdocumentId,
        type: 'archiveSubdocument',
      });
      await archiveSubdocumentMutation.mutateAsync({ subdocumentId, content });
    }
    finally {
      shouldSkipContentSaveRef.current = false;
    }
  };

  const restoreArchivedSubdocument = async (subdocumentId: string) => {
    const latestSubdocument = await queryClient.ensureQueryData(
      documentDetailQueryOptions(subdocumentId),
    );
    const restoredSubdocument = await restoreDocument(
      subdocumentId,
      latestSubdocument.version,
    );

    queryClient.setQueryData<Document>(
      documentKeys.detail(restoredSubdocument.id),
      restoredSubdocument,
    );

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: documentKeys.archivedList(workspaceSlug, 50),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      }),
    ]);
  };

  const archiveRestoredSubdocument = async (subdocumentId: string) => {
    const latestSubdocument = await queryClient.ensureQueryData(
      documentDetailQueryOptions(subdocumentId),
    );
    const archivedSubdocument = await archiveDocument(
      subdocumentId,
      latestSubdocument.version,
    );

    queryClient.setQueryData<Document>(
      documentKeys.detail(archivedSubdocument.id),
      archivedSubdocument,
    );

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: documentKeys.archivedList(workspaceSlug, 50),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      }),
    ]);
  };

  return {
    archiveRestoredSubdocument,
    archiveSubdocument,
    archivingSubdocumentId: archiveSubdocumentMutation.isPending
      ? archiveSubdocumentMutation.variables?.subdocumentId ?? null
      : null,
    createSubdocument,
    markPendingLocalPersistence: () => {
      hasPendingLocalPersistenceRef.current = true;
    },
    queueContentSave: async (content: Document['content']) => {
      syncLatestDocumentVersion();

      try {
        await draftPersistence.persistLocalDraft(content);
        hasPendingLocalPersistenceRef.current = false;
      }
      catch (error) {
        throw error;
      }

      return queueContentSave(content);
    },
    restoreArchivedSubdocument,
  };
}
