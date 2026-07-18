'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import {
  useArchiveSubdocumentMutation,
  documentKeys,
  setRecentWorkspaceDocumentId,
  type Document,
  updateDocument,
  useCreateSubdocumentMutation,
} from '@/domains/document';
import { hasMeaningfulContent } from '@shared/components/editor/has-meaningful-content';
import { updateCachedNavigationContentStatus } from '@/domains/document/cache/document-query-cache';

import { useLatestWinsSaveQueue } from './use-latest-wins-save-queue';

type UseDocumentEditorActionsOptions = {
  document: Document;
  workspaceSlug: string;
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
  document,
  workspaceSlug,
}: UseDocumentEditorActionsOptions) {
  const queryClient = useQueryClient();
  const documentId = document.id;
  const shouldSkipContentSaveRef = useRef(false);

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

      const latestDocument =
        queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ?? document;

      syncDocumentContentCache({
        ...latestDocument,
        content: nextContent,
      });

      const updatedDocument = await updateContentMutation.mutateAsync({
        version: latestDocument.version,
        content: nextContent,
      });

      syncDocumentContentCache({
        ...updatedDocument,
        content: nextContent,
      });
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
    const result = await createSubdocumentMutation.mutateAsync(input);
    return result.child_document;
  };

  const archiveSubdocument = async (subdocumentId: string, content?: unknown[]) => {
    shouldSkipContentSaveRef.current = true;

    try {
      await awaitContentSaveIdle();
      await archiveSubdocumentMutation.mutateAsync({ subdocumentId, content });
    }
    finally {
      shouldSkipContentSaveRef.current = false;
    }
  };

  return {
    archiveSubdocument,
    archivingSubdocumentId: archiveSubdocumentMutation.variables?.subdocumentId ?? null,
    createSubdocument,
    queueContentSave,
  };
}
