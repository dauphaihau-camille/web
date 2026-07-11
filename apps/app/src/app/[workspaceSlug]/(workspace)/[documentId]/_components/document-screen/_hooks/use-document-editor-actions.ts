'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import {
  archiveSubdocCommand,
  createSubdocCommand,
  documentKeys,
  setRecentWorkspaceDocumentId,
  type Document,
  updateDocument,
} from '@/domains/document';
import { hasMeaningfulContent } from '@shared/components/editor/has-meaningful-content';
import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
  removeCachedNavigationDocument,
  updateCachedNavigationContentStatus,
} from '@/domains/document/cache/document-query-cache';

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

export function useDocumentEditorActions({
  document,
  workspaceSlug,
}: UseDocumentEditorActionsOptions) {
  const queryClient = useQueryClient();
  const documentId = document.id;
  const shouldSkipContentSaveRef = useRef(false);

  const syncDocumentContentCache = (nextDocument: Document) => {
    queryClient.setQueryData<Document>(documentKeys.detail(documentId), nextDocument);
    updateCachedNavigationContentStatus(
      queryClient,
      workspaceSlug,
      documentId,
      hasMeaningfulContent(nextDocument.content),
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

  const createSubdocumentMutation = useMutation({
    mutationFn: (input?: CreateSubdocumentInput) => {
      const latestDocument =
        queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ?? document;

      return createSubdocCommand(documentId, {
        anchor_block_id: input?.anchorBlockId,
        slash_command_text: input?.slashCommandText,
        version: latestDocument.version,
        content: input?.content,
      });
    },
    onSuccess: async ({ child_document: childDocument, parent_document: parentDocument }) => {
      queryClient.setQueryData(documentKeys.detail(childDocument.id), childDocument);
      syncDocumentContentCache(parentDocument);
      markCachedNavigationNodeHasChildren(
        queryClient,
        workspaceSlug,
        documentId,
      );
      insertCreatedSubdocIntoCachedChildren(
        queryClient,
        workspaceSlug,
        documentId,
        childDocument,
      );

      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
    },
  });

  type ArchiveSubdocumentMutationContext = {
    previousListEntries: Array<readonly [ReadonlyArray<unknown>, unknown]>;
    previousParentDocument?: Document;
    previousSubdocument?: Document;
    toastId: string;
  };

  const archiveSubdocumentMutation = useMutation({
    mutationFn: async ({
      subdocumentId,
      content,
    }: {
      subdocumentId: string;
      content?: unknown[];
    }) => {
      const latestDocument =
        queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ?? document;

      return archiveSubdocCommand(documentId, {
        subdocument_id: subdocumentId,
        version: latestDocument.version,
        content,
      });
    },
    onMutate: async ({
      subdocumentId,
      content,
    }): Promise<ArchiveSubdocumentMutationContext> => {
      const toastId = `archive-subdoc:${subdocumentId}`;

      await Promise.all([
        queryClient.cancelQueries({ queryKey: documentKeys.detail(documentId) }),
        queryClient.cancelQueries({ queryKey: documentKeys.detail(subdocumentId) }),
        queryClient.cancelQueries({ queryKey: documentKeys.lists(workspaceSlug) }),
      ]);

      const previousParentDocument =
        queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ?? document;

      const previousSubdocument = queryClient.getQueryData<Document>(
        documentKeys.detail(subdocumentId),
      );
      const previousListEntries = queryClient.getQueriesData({
        queryKey: documentKeys.lists(workspaceSlug),
      });

      if (content !== undefined) {
        syncDocumentContentCache({
          ...previousParentDocument,
          content,
        });
      }

      removeCachedNavigationDocument(
        queryClient,
        workspaceSlug,
        subdocumentId,
      );

      toast('Moved to trash', { id: toastId });

      return {
        previousListEntries,
        previousParentDocument,
        previousSubdocument,
        toastId,
      };
    },
    onSuccess: async ({
      archived_child_document: archivedSubdocument,
      parent_document: parentDocument,
    }) => {
      syncDocumentContentCache(parentDocument);
      queryClient.setQueryData(
        documentKeys.detail(archivedSubdocument.id),
        archivedSubdocument,
      );
      removeCachedNavigationDocument(
        queryClient,
        workspaceSlug,
        archivedSubdocument.id,
      );

      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });

    },
    onError: (_error, variables, context) => {
      if (context?.previousParentDocument) {
        syncDocumentContentCache(context.previousParentDocument);
      }

      if (context?.previousSubdocument) {
        queryClient.setQueryData(
          documentKeys.detail(variables.subdocumentId),
          context.previousSubdocument,
        );
      }

      for (const [queryKey, data] of context?.previousListEntries ?? []) {
        queryClient.setQueryData(queryKey, data);
      }

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
