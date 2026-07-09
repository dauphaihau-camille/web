'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import {
  archiveDocument,
  createSubdocCommand,
  documentDetailQueryOptions,
  documentKeys,
  setRecentWorkspaceDocumentId,
  type Document,
  updateDocument,
} from '@shared/domains/document';
import { hasMeaningfulContent } from '@/components/editor/has-meaningful-content';
import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
  removeCachedNavigationDocument,
  updateCachedNavigationContentStatus,
} from '@/domains/document/cache/document-query-cache';

import { useLatestWinsSaveQueue } from './use-latest-wins-save-queue';

type UseDocumentScreenOperationsOptions = {
  document: Document;
  workspaceSlug: string;
};

type CreateSubdocumentInput = {
  anchorBlockId?: string;
  slashCommandText?: string;
  content?: unknown[];
};

export function useDocumentScreenOperations({
  document,
  workspaceSlug,
}: UseDocumentScreenOperationsOptions) {
  const queryClient = useQueryClient();
  const documentId = document.id;

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

  const queueContentSave = useLatestWinsSaveQueue<Document['content'], Record<string, never>>({
    initialMeta: {},
    onFlush: async (nextContent) => {
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

  const archiveSubdocumentMutation = useMutation({
    mutationFn: async (subdocumentId: string) => {
      const subdocument = await queryClient.ensureQueryData(
        documentDetailQueryOptions(subdocumentId),
      );

      return archiveDocument(subdocumentId, subdocument.version);
    },
    onSuccess: async (archivedSubdocument) => {
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

      toast('Moved to trash');
    },
  });

  useEffect(() => {
    setRecentWorkspaceDocumentId(workspaceSlug, documentId);
  }, [documentId, workspaceSlug]);

  const createSubdocument = async (input?: CreateSubdocumentInput) => {
    const result = await createSubdocumentMutation.mutateAsync(input);
    return result.child_document;
  };

  const archiveSubdocument = async (subdocumentId: string) => {
    await archiveSubdocumentMutation.mutateAsync(subdocumentId);
  };

  return {
    archiveSubdocument,
    archivingSubdocumentId: archiveSubdocumentMutation.variables ?? null,
    createSubdocument,
    queueContentSave,
  };
}
