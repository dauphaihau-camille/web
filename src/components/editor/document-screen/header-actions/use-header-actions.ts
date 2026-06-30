'use client';

import { useKeyPress } from 'ahooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  archiveDocument,
  createDocument,
  documentKeys,
  type Document,
} from '@/domains/document';

import { buildDuplicateTitle } from './header-actions.utils';

type UseHeaderActionsOptions = {
  workspaceId: string;
  document: Document;
};

export function useHeaderActions({
  workspaceId,
  document,
}: UseHeaderActionsOptions) {
  const queryClient = useQueryClient();

  const duplicateDocumentMutation = useMutation({
    mutationFn: async () =>
      createDocument({
        workspace_id: workspaceId,
        teamspace_id: document.teamspace_id,
        parent_document_id: document.parent_document_id,
        title: buildDuplicateTitle(document.title),
        content_format: document.content_format,
        content: document.content,
      }),
    onSuccess: async (duplicatedDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(duplicatedDocument.id),
        duplicatedDocument,
      );
      await queryClient.invalidateQueries({
        queryKey: documentKeys.tree(workspaceId),
      });
    },
  });

  const archiveDocumentMutation = useMutation({
    mutationFn: () => archiveDocument(document.id, document.version),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: documentKeys.tree(workspaceId),
      });
    },
  });

  const copyLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    toast.success('Copied page link to clipboard');
  };

  useKeyPress(
    'meta.shift.l',
    (event) => {
      event.preventDefault();
      void copyLink();
    },
    {
      exactMatch: true,
    },
  );

  const duplicateDocument = () => {
    void duplicateDocumentMutation.mutateAsync();
  };

  const archiveCurrentDocument = () => {
    void archiveDocumentMutation.mutateAsync();
  };

  return {
    archiveCurrentDocument,
    copyLink,
    duplicateDocument,
    isArchiving: archiveDocumentMutation.isPending,
    isDuplicating: duplicateDocumentMutation.isPending,
  };
}
