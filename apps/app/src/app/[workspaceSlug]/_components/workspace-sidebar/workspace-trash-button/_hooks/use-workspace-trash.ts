'use client';

import { useState } from 'react';
import { useDebounceFn } from 'ahooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  documentKeys,
  type ArchivedDocumentListPage,
  type Document,
  permanentlyDeleteDocument,
  restoreDocument,
  workspaceArchivedDocumentListQueryOptions,
} from '@shared/domains/document';

const ARCHIVED_DOCUMENT_PAGE_SIZE = 50;

type TrashDialogDocument = {
  id: string;
  title: string;
  version: number;
};

type RestoreDocumentVariables = {
  documentId: string;
  version: number;
};

type PermanentlyDeleteDocumentVariables = {
  documentId: string;
  version: number;
};

type RestoreMutationContext = {
  previousArchivedLists: Array<
    readonly [readonly unknown[], ArchivedDocumentListPage | undefined]
  >;
  previousDocument: Document | undefined;
};

export function useWorkspaceTrash({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteDialogDocument, setDeleteDialogDocument] =
    useState<TrashDialogDocument | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchQueryValue, setSearchQueryValue] = useState('');
  const {
    run: scheduleSearchQueryUpdate,
    cancel: cancelScheduledSearchQueryUpdate,
  } = useDebounceFn(
    (nextValue: string) => {
      setSearchQueryValue(nextValue);
    },
    { wait: 300 },
  );

  const trashQuery = useQuery({
    ...workspaceArchivedDocumentListQueryOptions(
      workspaceSlug,
      ARCHIVED_DOCUMENT_PAGE_SIZE,
      undefined,
      searchQueryValue,
    ),
    enabled: isOpen,
  });

  const restoreMutation = useMutation<
    Document,
    Error,
    RestoreDocumentVariables,
    RestoreMutationContext
  >({
    mutationFn: ({ documentId, version }) => restoreDocument(documentId, version),
    onMutate: async ({ documentId }) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: documentKeys.archivedList(
            workspaceSlug,
            ARCHIVED_DOCUMENT_PAGE_SIZE,
          ),
        }),
        queryClient.cancelQueries({
          queryKey: documentKeys.detail(documentId),
        }),
      ]);

      const previousArchivedLists =
        queryClient.getQueriesData<ArchivedDocumentListPage>({
          queryKey: [...documentKeys.lists(workspaceSlug), 'archived'],
        });
      const previousDocument = queryClient.getQueryData<Document>(
        documentKeys.detail(documentId),
      );

      queryClient.setQueriesData<ArchivedDocumentListPage>(
        { queryKey: [...documentKeys.lists(workspaceSlug), 'archived'] },
        (currentPage) => {
          if (!currentPage) {
            return currentPage;
          }

          return {
            ...currentPage,
            items: currentPage.items.filter((item) => item.id !== documentId),
          };
        },
      );

      if (previousDocument) {
        queryClient.setQueryData<Document>(documentKeys.detail(documentId), {
          ...previousDocument,
          archived_at: undefined,
          archived_by_name: undefined,
        });
      }

      return {
        previousArchivedLists,
        previousDocument,
      };
    },
    onError: (_error, variables, context) => {
      context?.previousArchivedLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      if (context?.previousDocument) {
        queryClient.setQueryData(
          documentKeys.detail(variables.documentId),
          context.previousDocument,
        );
      }
    },
    onSuccess: async (document) => {
      queryClient.setQueryData(documentKeys.detail(document.id), document);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: documentKeys.archivedList(
            workspaceSlug,
            ARCHIVED_DOCUMENT_PAGE_SIZE,
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
      ]);
      toast('Document restored');
    },
  });

  const permanentlyDeleteMutation = useMutation<
    void,
    Error,
    PermanentlyDeleteDocumentVariables
  >({
    mutationFn: ({ documentId, version }) =>
      permanentlyDeleteDocument(documentId, version),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: documentKeys.archivedList(
          workspaceSlug,
          ARCHIVED_DOCUMENT_PAGE_SIZE,
        ),
      });
      toast('Document permanently deleted');
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);

    if (!nextOpen) {
      setSearchValue('');
      setSearchQueryValue('');
      cancelScheduledSearchQueryUpdate();
    }
  };

  const handleSearchChange = (nextValue: string) => {
    setSearchValue(nextValue);
    scheduleSearchQueryUpdate(nextValue.trim());
  };

  const handlePopoverLinkClick = () => {
    setIsOpen(false);
  };

  const handleRestoreDocument = ({
    documentId,
    version,
  }: RestoreDocumentVariables) => {
    void restoreMutation.mutateAsync({ documentId, version });
  };

  const openDeleteDialog = (document: TrashDialogDocument) => {
    setDeleteDialogDocument(document);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteDialogDocument(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteDialogDocument) {
      return;
    }

    setDeleteDialogDocument(null);
    void permanentlyDeleteMutation.mutateAsync({
      documentId: deleteDialogDocument.id,
      version: deleteDialogDocument.version,
    });
  };

  const busyDocumentId =
    restoreMutation.variables?.documentId ??
    permanentlyDeleteMutation.variables?.documentId;

  return {
    busyDocumentId,
    deleteDialogDocument,
    handleConfirmDelete,
    handleDeleteDialogOpenChange,
    handleOpenChange,
    handlePopoverLinkClick,
    handleRestoreDocument,
    handleSearchChange,
    isDeleteDialogOpen: deleteDialogDocument !== null,
    isDeletingSelectedDocument: permanentlyDeleteMutation.isPending
      && permanentlyDeleteMutation.variables?.documentId === deleteDialogDocument?.id,
    isLoading: trashQuery.isLoading,
    isOpen,
    items: trashQuery.data?.items ?? [],
    openDeleteDialog,
    permanentlyDeleteMutation,
    restoreMutation,
    searchQueryValue,
    searchValue,
  };
}
