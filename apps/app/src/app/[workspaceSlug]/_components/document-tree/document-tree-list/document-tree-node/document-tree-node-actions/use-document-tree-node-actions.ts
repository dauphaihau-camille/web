'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  archiveDocument,
  createDocument,
  documentDetailQueryOptions,
  documentKeys,
  duplicateDocument,
  type Document,
  type DocumentNavigationNode,
} from '@/domains/document';
import {
  favoriteDocument,
  favoriteKeys,
  type FavoriteDocument,
  type FavoriteStatus,
  unfavoriteDocument,
} from '@/domains/favorite';
import { useDocumentTreeExpansionStore } from '@/stores/document-tree-expansion-store';
import { workspaceRoutes } from '@/domains/workspace';
import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
} from '@/domains/document/cache/document-query-cache';

import { resolveArchiveDestination } from './document-tree-node-action-helpers';
import {
  applyArchiveCacheState,
  applyFavoriteCacheState,
  getDocumentListSnapshot,
  markCachedFavoriteDocumentHasChildren,
  restoreDocumentListSnapshot,
  type DocumentListSnapshot,
} from './document-tree-node-action-cache';

const ARCHIVE_TOAST_ID = 'document-tree-archive';

type UseDocumentTreeNodeActionArgs = {
  document: DocumentNavigationNode;
  isActive: boolean;
  workspaceSlug: string;
};

type ArchiveMutationVariables = {
  previousRoute?: string;
  version: number;
};

type ArchiveMutationContext = {
  previousDocument?: Document;
  previousDocumentLists: DocumentListSnapshot;
  previousExpandedDocumentIds: string[];
  previousWorkspaceFavorites?: FavoriteDocument[];
};

type FavoriteMutationContext = {
  previousDocument?: Document;
  previousDocumentLists: DocumentListSnapshot;
  previousFavoriteStatus?: FavoriteStatus;
  previousWorkspaceFavorites?: FavoriteDocument[];
};

function useCreateSubdocumentAction({
  document,
  workspaceSlug,
}: Omit<UseDocumentTreeNodeActionArgs, 'isActive'>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const expandedByWorkspace = useDocumentTreeExpansionStore(
    (state) => state.expandedByWorkspace,
  );
  const setExpandedDocumentIds = useDocumentTreeExpansionStore(
    (state) => state.setExpandedDocumentIds,
  );

  const mutation = useMutation({
    mutationFn: () =>
      createDocument({
        workspace_id: workspaceSlug,
        teamspace_id: document.teamspace_id,
        parent_document_id: document.id,
      }),
    onSuccess: async (childDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(childDocument.id),
        childDocument,
      );
      markCachedNavigationNodeHasChildren(
        queryClient,
        workspaceSlug,
        document.id,
      );
      markCachedFavoriteDocumentHasChildren(
        queryClient,
        workspaceSlug,
        document.id,
      );
      insertCreatedSubdocIntoCachedChildren(
        queryClient,
        workspaceSlug,
        document.id,
        childDocument,
      );
      setExpandedDocumentIds(workspaceSlug, [
        ...(expandedByWorkspace[workspaceSlug] ?? []),
        document.id,
      ]);
      await queryClient.invalidateQueries({
        queryKey: documentKeys.detail(document.id),
      });
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
      router.push(
        workspaceRoutes.document(
          workspaceSlug,
          childDocument.public_id,
          childDocument.title,
        ),
      );
    },
  });

  return {
    createSubdocumentMutation: mutation,
    handleCreateSubdocument: () => {
      void mutation.mutateAsync();
    },
  };
}

function useDuplicateDocumentAction({
  document,
  workspaceSlug,
}: Omit<UseDocumentTreeNodeActionArgs, 'isActive'>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => duplicateDocument(document.id),
    onSuccess: async (duplicatedDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(duplicatedDocument.id),
        duplicatedDocument,
      );
      if (duplicatedDocument.parent_document_id) {
        await queryClient.invalidateQueries({
          queryKey: documentKeys.detail(duplicatedDocument.parent_document_id),
        });
      }
      await queryClient.invalidateQueries({
        queryKey: documentKeys.detail(document.id),
      });
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
    },
  });

  return {
    duplicateDocumentMutation: mutation,
    handleDuplicate: () => {
      void mutation.mutateAsync();
    },
  };
}

function useFavoriteDocumentAction({
  document,
  workspaceSlug,
}: Omit<UseDocumentTreeNodeActionArgs, 'isActive'>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    FavoriteStatus,
    Error,
    { nextIsFavorite: boolean },
    FavoriteMutationContext
  >({
    mutationFn: async ({ nextIsFavorite }) => {
      if (!nextIsFavorite) {
        return unfavoriteDocument(document.id);
      }

      return favoriteDocument(document.id);
    },
    onMutate: async ({ nextIsFavorite }) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: favoriteKeys.status(document.id),
        }),
        queryClient.cancelQueries({
          queryKey: favoriteKeys.workspaceList(workspaceSlug),
        }),
        queryClient.cancelQueries({
          queryKey: documentKeys.detail(document.id),
        }),
        queryClient.cancelQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
      ]);

      const previousFavoriteStatus = queryClient.getQueryData<FavoriteStatus>(
        favoriteKeys.status(document.id),
      );
      const previousWorkspaceFavorites = queryClient.getQueryData<FavoriteDocument[]>(
        favoriteKeys.workspaceList(workspaceSlug),
      );
      const previousDocument = queryClient.getQueryData<Document>(
        documentKeys.detail(document.id),
      );
      const previousDocumentLists = getDocumentListSnapshot(
        queryClient,
        workspaceSlug,
      );

      applyFavoriteCacheState(
        queryClient,
        workspaceSlug,
        document,
        nextIsFavorite,
      );

      return {
        previousDocument,
        previousDocumentLists,
        previousFavoriteStatus,
        previousWorkspaceFavorites,
      };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        restoreDocumentListSnapshot(queryClient, context.previousDocumentLists);
      }

      if (context?.previousFavoriteStatus) {
        queryClient.setQueryData(
          favoriteKeys.status(document.id),
          context.previousFavoriteStatus,
        );
      }

      if (context?.previousDocument) {
        queryClient.setQueryData(
          documentKeys.detail(document.id),
          context.previousDocument,
        );
      }

      if (context?.previousWorkspaceFavorites) {
        queryClient.setQueryData(
          favoriteKeys.workspaceList(workspaceSlug),
          context.previousWorkspaceFavorites,
        );
      }

      toast('Could not update favorites');
    },
    onSuccess: async (status) => {
      applyFavoriteCacheState(
        queryClient,
        workspaceSlug,
        document,
        status.is_favorite,
      );
      toast(
        status.is_favorite ? 'Added to favorites' : 'Removed from favorites',
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: favoriteKeys.status(document.id),
        }),
        queryClient.invalidateQueries({
          queryKey: favoriteKeys.workspaceList(workspaceSlug),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.detail(document.id),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
      ]);
    },
  });

  return {
    favoriteMutation: mutation,
    handleToggleFavorite: () => {
      void mutation.mutateAsync({
        nextIsFavorite: !document.is_favorite,
      });
    },
    isFavorite: document.is_favorite,
  };
}

function useArchiveDocumentAction({
  document,
  isActive,
  workspaceSlug,
}: UseDocumentTreeNodeActionArgs) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const expandedByWorkspace = useDocumentTreeExpansionStore(
    (state) => state.expandedByWorkspace,
  );
  const setExpandedDocumentIds = useDocumentTreeExpansionStore(
    (state) => state.setExpandedDocumentIds,
  );

  const mutation = useMutation<
    Document,
    Error,
    ArchiveMutationVariables,
    ArchiveMutationContext
  >({
    mutationFn: ({ version }) => archiveDocument(document.id, version),
    onMutate: async ({ version }) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: documentKeys.detail(document.id),
        }),
        queryClient.cancelQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
        queryClient.cancelQueries({
          queryKey: favoriteKeys.workspaceList(workspaceSlug),
        }),
      ]);

      const previousDocumentLists = getDocumentListSnapshot(
        queryClient,
        workspaceSlug,
      );
      const previousDocument = queryClient.getQueryData<Document>(
        documentKeys.detail(document.id),
      );
      const previousWorkspaceFavorites = queryClient.getQueryData<
        FavoriteDocument[]
      >(favoriteKeys.workspaceList(workspaceSlug));
      const previousExpandedDocumentIds =
        expandedByWorkspace[workspaceSlug] ?? [];

      applyArchiveCacheState(queryClient, workspaceSlug, document.id, version);

      setExpandedDocumentIds(
        workspaceSlug,
        previousExpandedDocumentIds.filter((documentId) => documentId !== document.id),
      );

      toast('Moved to trash', {
        id: `${ARCHIVE_TOAST_ID}-${document.id}`,
      });

      return {
        previousDocument,
        previousDocumentLists,
        previousExpandedDocumentIds,
        previousWorkspaceFavorites,
      };
    },
    onError: (_error, variables, context) => {
      if (context) {
        restoreDocumentListSnapshot(queryClient, context.previousDocumentLists);
      }

      if (context?.previousDocument) {
        queryClient.setQueryData(
          documentKeys.detail(document.id),
          context.previousDocument,
        );
      }

      if (context?.previousWorkspaceFavorites) {
        queryClient.setQueryData(
          favoriteKeys.workspaceList(workspaceSlug),
          context.previousWorkspaceFavorites,
        );
      }

      if (context) {
        setExpandedDocumentIds(
          workspaceSlug,
          context.previousExpandedDocumentIds,
        );
      }

      if (variables.previousRoute) {
        router.replace(variables.previousRoute);
      }

      toast('Could not move to trash', {
        id: `${ARCHIVE_TOAST_ID}-${document.id}`,
      });
    },
    onSuccess: (archivedDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(document.id),
        archivedDocument,
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: documentKeys.detail(document.id),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
        queryClient.invalidateQueries({
          queryKey: favoriteKeys.workspaceList(workspaceSlug),
        }),
      ]);
    },
  });

  const handleArchive = () => {
    void (async () => {
      const documentDetail = await queryClient.ensureQueryData(
        documentDetailQueryOptions(document.id),
      );
      const nextDocument = isActive
        ? await resolveArchiveDestination({
          document: documentDetail,
          queryClient,
          workspaceSlug,
        })
        : null;
      const nextRoute = isActive
        ? nextDocument
          ? workspaceRoutes.document(
            workspaceSlug,
            nextDocument.public_id,
            nextDocument.title,
          )
          : workspaceRoutes.detail(workspaceSlug)
        : undefined;
      const previousRoute =
        isActive && typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : undefined;

      if (nextRoute) {
        router.replace(nextRoute);
      }

      try {
        await mutation.mutateAsync({
          previousRoute,
          version: documentDetail.version,
        });
      }
      catch {
        return;
      }
    })();
  };

  return {
    archiveDocumentMutation: mutation,
    handleArchive,
  };
}

export function useDocumentTreeNodeActions({
  document,
  isActive,
  workspaceSlug,
}: UseDocumentTreeNodeActionArgs) {
  const {
    createSubdocumentMutation,
    handleCreateSubdocument,
  } = useCreateSubdocumentAction({
    document,
    workspaceSlug,
  });
  const {
    duplicateDocumentMutation,
    handleDuplicate,
  } = useDuplicateDocumentAction({
    document,
    workspaceSlug,
  });
  const {
    favoriteMutation,
    handleToggleFavorite,
    isFavorite,
  } = useFavoriteDocumentAction({
    document,
    workspaceSlug,
  });
  const {
    archiveDocumentMutation,
    handleArchive,
  } = useArchiveDocumentAction({
    document,
    isActive,
    workspaceSlug,
  });

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    await navigator.clipboard.writeText(
      `${window.location.origin}${workspaceRoutes.document(
        workspaceSlug,
        document.public_id,
        document.title,
      )}`,
    );
    toast('Copied page link to clipboard');
  };

  return {
    archiveDocumentMutation,
    createSubdocumentMutation,
    duplicateDocumentMutation,
    favoriteMutation,
    handleArchive,
    handleCopyLink,
    handleCreateSubdocument,
    handleDuplicate,
    handleToggleFavorite,
    isFavorite,
  };
}
