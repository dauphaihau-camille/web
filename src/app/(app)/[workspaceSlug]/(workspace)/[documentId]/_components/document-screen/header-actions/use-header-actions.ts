'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  archiveDocument,
  documentDetailQueryOptions,
  documentKeys,
  type DocumentNavigationNode,
  type WorkspaceDocumentNavigation,
  duplicateDocument as duplicateDocumentRequest,
  workspaceDocumentChildrenQueryOptions,
  workspaceDocumentRootQueryOptions,
  type Document,
} from '@/domains/document';
import {
  favoriteDocument as addFavoriteDocument,
  favoriteKeys,
  unfavoriteDocument,
  useFavoriteStatusQuery,
} from '@/domains/favorite';
import {
  publishDocument,
  publishKeys,
  unpublishDocument,
  usePublishStatusQuery,
} from '@/domains/publish';
import { workspaceRoutes } from '@/domains/workspace';

import { removeCachedNavigationDocument } from '../document-screen-cache';

type UseHeaderActionsOptions = {
  workspaceSlug: string;
  document: Document;
};

export function useHeaderActions({
  workspaceSlug,
  document,
}: UseHeaderActionsOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const favoriteStatusQuery = useFavoriteStatusQuery(document.id);
  const publishStatusQuery = usePublishStatusQuery(document.id);

  const duplicateDocumentMutation = useMutation({
    mutationFn: async () => duplicateDocumentRequest(document.id),
    onSuccess: async (duplicatedDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(duplicatedDocument.id),
        duplicatedDocument,
      );
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
    },
  });

  const archiveDocumentMutation = useMutation({
    mutationFn: () => archiveDocument(document.id, document.version),
    onSuccess: async (archivedDocument) => {
      queryClient.setQueryData(documentKeys.detail(document.id), archivedDocument);
      removeCachedNavigationDocument(queryClient, workspaceSlug, document.id);
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
      await queryClient.invalidateQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      });
      toast('Moved to trash');
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (favoriteStatusQuery.data?.is_favorite) {
        return unfavoriteDocument(document.id);
      }

      return addFavoriteDocument(document.id);
    },
    onSuccess: async (status) => {
      queryClient.setQueryData(favoriteKeys.status(document.id), status);
      await queryClient.invalidateQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      });
      toast(status.is_favorite ? 'Added to favorites' : 'Removed from favorites');
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishDocument(document.id),
    onSuccess: (status) => {
      queryClient.setQueryData(publishKeys.status(document.id), status);
      toast('Published document');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishDocument(document.id),
    onSuccess: (status) => {
      queryClient.setQueryData(publishKeys.status(document.id), status);
      toast('Unpublished document');
    },
  });

  const copyLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    toast('Copied page link to clipboard');
  };

  const duplicateDocument = () => {
    void duplicateDocumentMutation.mutateAsync();
  };

  const archiveCurrentDocument = () => {
    void (async () => {
      const nextDocument = await resolveArchiveDestination({
        document,
        queryClient,
        workspaceSlug,
      });

      await archiveDocumentMutation.mutateAsync();

      router.replace(
        nextDocument
          ? workspaceRoutes.document(
            workspaceSlug,
            nextDocument.public_id,
            nextDocument.title,
          )
          : workspaceRoutes.detail(workspaceSlug),
      );
    })();
  };

  const toggleFavorite = () => {
    void favoriteMutation.mutateAsync();
  };

  const copyPublishedLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const status = publishStatusQuery.data ?? await publishMutation.mutateAsync();

    if (!status.public_path) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}${status.public_path}`);
    toast('Copied published link to clipboard');
  };

  const publishCurrentDocument = () => {
    void publishMutation.mutateAsync();
  };

  const unpublishCurrentDocument = () => {
    void unpublishMutation.mutateAsync();
  };

  return {
    archiveCurrentDocument,
    copyLink,
    copyPublishedLink,
    duplicateDocument,
    favoriteStatus: favoriteStatusQuery.data,
    isFavoriting: favoriteMutation.isPending || favoriteStatusQuery.isLoading,
    isArchiving: archiveDocumentMutation.isPending,
    isDuplicating: duplicateDocumentMutation.isPending,
    isPublishing: publishMutation.isPending,
    isUnpublishing: unpublishMutation.isPending,
    publishStatus: publishStatusQuery.data,
    publishCurrentDocument,
    toggleFavorite,
    unpublishCurrentDocument,
  };
}

function orderDocuments(items: DocumentNavigationNode[]) {
  return [...items].sort((left, right) => right.sort_key - left.sort_key);
}

function getNearestDocument(
  items: DocumentNavigationNode[],
  currentDocumentId: string,
) {
  const orderedItems = orderDocuments(items);
  const currentIndex = orderedItems.findIndex((item) => item.id === currentDocumentId);

  if (currentIndex === -1) {
    return orderedItems[0] ?? null;
  }

  return orderedItems[currentIndex - 1]
    ?? orderedItems[currentIndex + 1]
    ?? null;
}

async function resolveArchiveDestination({
  document,
  queryClient,
  workspaceSlug,
}: {
  document: Document;
  queryClient: QueryClient;
  workspaceSlug: string;
}) {
  if (document.parent_document_id) {
    const siblingPage = await queryClient.ensureQueryData(
      workspaceDocumentChildrenQueryOptions(workspaceSlug, document.parent_document_id),
    );
    const siblingDocument = getNearestDocument(siblingPage.items, document.id);

    if (siblingDocument) {
      return siblingDocument;
    }

    return queryClient.ensureQueryData(documentDetailQueryOptions(document.parent_document_id));
  }

  const rootNavigation = await queryClient.ensureQueryData(
    workspaceDocumentRootQueryOptions(workspaceSlug),
  );
  const rootItems = getRootNavigationItems(rootNavigation, document.teamspace_id);

  return getNearestDocument(rootItems, document.id);
}

function getRootNavigationItems(
  navigation: WorkspaceDocumentNavigation,
  teamspaceId?: string,
) {
  if (!teamspaceId) {
    return navigation.private_documents.items;
  }

  return navigation.teamspaces.find((teamspace) => teamspace.id === teamspaceId)?.documents.items ?? [];
}
