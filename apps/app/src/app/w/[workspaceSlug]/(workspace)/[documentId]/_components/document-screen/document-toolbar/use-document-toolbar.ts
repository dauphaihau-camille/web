'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { hasMeaningfulContent } from '@shared/components/editor/has-meaningful-content';
import {
  documentDetailQueryOptions,
  documentKeys,
  permanentlyDeleteDocument,
  restoreDocument,
  type Document,
} from '@/domains/document';
import {
  publishDocument,
  unpublishDocument,
} from '@shared/domains/publish';
import { workspaceRoutes } from '@/domains/workspace';
import { useRouter } from 'next/navigation';
import type { FavoriteDocument } from '@/domains/favorite';
import { useDocumentActions } from '@/domains/document/hooks/use-document-actions';

import { buildPublishedDocumentUrl } from './document-toolbar.utils';

type UseDocumentToolbarOptions = {
  workspaceSlug: string;
  document: Document;
};

type RestoreMutationContext = {
  previousDocument?: Document;
};

function createOptimisticFavoriteDocument(document: Document): FavoriteDocument {
  return {
    document_id: document.id,
    favorited_at: new Date().toISOString(),
    has_children: false,
    has_content: hasMeaningfulContent(document.content),
    parent_document_id: document.parent_document_id,
    public_id: document.public_id,
    sort_key: document.sort_key,
    teamspace_id: document.teamspace_id,
    title: document.title,
    workspace_id: document.workspace_id,
    access: {
      permission: 'manage',
      can_view: true,
      can_edit: true,
      can_manage: true,
    },
  };
}

export function useDocumentToolbar({
  workspaceSlug,
  document,
}: UseDocumentToolbarOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    archiveDocumentMutation,
    duplicateDocumentMutation,
    favoriteMutation,
    favoriteStatus,
    handleArchive,
    handleCopyLink,
    handleDuplicate,
    handleToggleFavorite,
  } = useDocumentActions({
    document,
    workspaceSlug,
    shouldNavigateOnArchive: true,
    buildDocumentHref: (targetDocument) =>
      workspaceRoutes.document(
        workspaceSlug,
        targetDocument.public_id,
        targetDocument.title,
      ),
    createOptimisticFavoriteDocument: () =>
      createOptimisticFavoriteDocument(document),
    getCopyLinkUrl: () =>
      typeof window === 'undefined' ? undefined : window.location.href,
  });

  const publishMutation = useMutation({
    mutationFn: () => publishDocument(document.id),
    onSuccess: (status) => {
      queryClient.setQueryData<Document>(
        documentKeys.detail(document.id),
        (currentDocument) => currentDocument
          ? {
            ...currentDocument,
            published_document_id: status.published_document_id,
            public_path: status.public_path,
          }
          : currentDocument,
      );
      toast('Published document');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishDocument(document.id),
    onSuccess: (status) => {
      queryClient.setQueryData<Document>(
        documentKeys.detail(document.id),
        (currentDocument) => currentDocument
          ? {
            ...currentDocument,
            published_document_id: status.published_document_id,
            public_path: status.public_path,
          }
          : currentDocument,
      );
      toast('Unpublished document');
    },
  });

  const restoreDocumentMutation = useMutation({
    mutationFn: async () => {
      const latestDocument = await queryClient.ensureQueryData(
        documentDetailQueryOptions(document.id),
      );

      return restoreDocument(document.id, latestDocument.version);
    },
    onMutate: async (): Promise<RestoreMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: documentKeys.detail(document.id),
      });

      const previousDocument = queryClient.getQueryData<Document>(
        documentKeys.detail(document.id),
      );

      if (previousDocument) {
        queryClient.setQueryData<Document>(documentKeys.detail(document.id), {
          ...previousDocument,
          archived_at: undefined,
          archived_by_name: undefined,
        });
      }

      return {
        previousDocument,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousDocument) {
        queryClient.setQueryData(
          documentKeys.detail(document.id),
          context.previousDocument,
        );
      }
    },
    onSuccess: async (restoredDocument) => {
      queryClient.setQueryData(documentKeys.detail(document.id), restoredDocument);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: documentKeys.archivedList(workspaceSlug, 50),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
      ]);
      toast('Document restored');
    },
  });

  const permanentlyDeleteDocumentMutation = useMutation({
    mutationFn: async () => {
      const latestDocument = await queryClient.ensureQueryData(
        documentDetailQueryOptions(document.id),
      );

      await permanentlyDeleteDocument(document.id, latestDocument.version);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: documentKeys.archivedList(workspaceSlug, 50),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
      ]);
      toast('Document permanently deleted');
      router.replace(workspaceRoutes.detail(workspaceSlug));
    },
  });

  const copyPublishedLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const status =
      document.published_document_id && document.public_path
        ? {
          document_id: document.id,
          published_document_id: document.published_document_id,
          public_path: document.public_path,
        }
        : await publishMutation.mutateAsync();

    if (!status.public_path) {
      return;
    }

    await navigator.clipboard.writeText(
      buildPublishedDocumentUrl(status.public_path),
    );
    toast('Copied published link to clipboard');
  };

  const publishCurrentDocument = () => {
    void publishMutation.mutateAsync();
  };

  const unpublishCurrentDocument = () => {
    void unpublishMutation.mutateAsync();
  };

  const restoreCurrentDocument = () => {
    void restoreDocumentMutation.mutateAsync();
  };

  const permanentlyDeleteCurrentDocument = () => {
    void permanentlyDeleteDocumentMutation.mutateAsync();
  };

  return {
    archiveCurrentDocument: handleArchive,
    copyLink: handleCopyLink,
    copyPublishedLink,
    duplicateDocument: handleDuplicate,
    favoriteStatus,
    isArchived: Boolean(document.archived_at),
    isFavoriting: favoriteMutation.isPending,
    isArchiving: archiveDocumentMutation.isPending,
    isPermanentlyDeleting: permanentlyDeleteDocumentMutation.isPending,
    isRestoring: restoreDocumentMutation.isPending,
    isDuplicating: duplicateDocumentMutation.isPending,
    isPublishing: publishMutation.isPending,
    isUnpublishing: unpublishMutation.isPending,
    permanentlyDeleteCurrentDocument,
    publishStatus: {
      document_id: document.id,
      published_document_id: document.published_document_id,
      public_path: document.public_path,
    },
    publishCurrentDocument,
    restoreCurrentDocument,
    toggleFavorite: handleToggleFavorite,
    unpublishCurrentDocument,
  };
}
