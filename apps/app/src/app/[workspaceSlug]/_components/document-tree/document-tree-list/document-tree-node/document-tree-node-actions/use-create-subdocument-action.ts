'use client';

import { useQueryClient } from '@tanstack/react-query';

import {
  documentKeys,
  type Document,
  type DocumentNavigationNode,
  useCreateSubdocumentMutation,
} from '@/domains/document';
import { dispatchDocumentSubdocCreatedEvent } from '@/domains/document/document-subdoc-created-event';
import {
  markCachedNavigationNodeHasChildren,
  insertCreatedSubdocIntoCachedChildren,
} from '@/domains/document/cache/document-query-cache';
import {
  getDocumentListSnapshot,
  markCachedFavoriteDocumentHasChildren,
  restoreDocumentListSnapshot,
} from '@/domains/document/actions/document-action-cache';
import {
  favoriteKeys,
  type FavoriteDocument,
} from '@/domains/favorite';
import { useDocumentTreeExpansionStore } from '@/stores/document-tree-expansion-store';

function createOptimisticSubdocument(
  document: DocumentNavigationNode,
  workspaceSlug: string,
): Document {
  const now = Date.now();
  const timestamp = new Date(now).toISOString();

  return {
    id: `optimistic-subdoc:${document.id}:${now}`,
    public_id: `optimistic-subdoc:${document.public_id}:${now}`,
    version: 0,
    workspace_id: workspaceSlug,
    owner_user_id: 'optimistic-owner',
    teamspace_id: document.teamspace_id,
    parent_document_id: document.id,
    title: 'Untitled',
    content_format: 'blocknote_v1',
    content: [],
    sort_key: now,
    archived_at: undefined,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

type CreateSubdocumentMutationContext = {
  optimisticChildId: string;
  previousDocumentLists: ReturnType<typeof getDocumentListSnapshot>;
  previousExpandedDocumentIds: string[];
  previousParentDocument?: Document;
  previousWorkspaceFavorites?: FavoriteDocument[];
};

export function useCreateSubdocumentAction({
  document,
  workspaceSlug,
}: {
  document: DocumentNavigationNode;
  workspaceSlug: string;
}) {
  const queryClient = useQueryClient();

  const expandedByWorkspace = useDocumentTreeExpansionStore(
    (state) => state.expandedByWorkspace,
  );

  const setExpandedDocumentIds = useDocumentTreeExpansionStore(
    (state) => state.setExpandedDocumentIds,
  );

  const createSubdocumentMutation = useCreateSubdocumentMutation<
    DocumentNavigationNode,
    CreateSubdocumentMutationContext
  >({
    document,
    workspaceSlug,
    onMutate: async (): Promise<CreateSubdocumentMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      });

      const previousDocumentLists = getDocumentListSnapshot(queryClient, workspaceSlug);
      const previousParentDocument = queryClient.getQueryData<Document>(
        documentKeys.detail(document.id),
      );
      const previousWorkspaceFavorites = queryClient.getQueryData<FavoriteDocument[]>(
        favoriteKeys.workspaceList(workspaceSlug),
      );
      const previousExpandedDocumentIds = expandedByWorkspace[workspaceSlug] ?? [];
      const optimisticChildDocument = createOptimisticSubdocument(
        document,
        workspaceSlug,
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
        optimisticChildDocument,
      );
      setExpandedDocumentIds(
        workspaceSlug,
        previousExpandedDocumentIds.includes(document.id)
          ? previousExpandedDocumentIds
          : [...previousExpandedDocumentIds, document.id],
      );

      return {
        optimisticChildId: optimisticChildDocument.id,
        previousDocumentLists,
        previousExpandedDocumentIds,
        previousParentDocument,
        previousWorkspaceFavorites,
      };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        restoreDocumentListSnapshot(queryClient, context.previousDocumentLists);
        setExpandedDocumentIds(workspaceSlug, context.previousExpandedDocumentIds);
      }

      if (context?.previousParentDocument) {
        queryClient.setQueryData(
          documentKeys.detail(document.id),
          context.previousParentDocument,
        );
      }

      if (context?.previousWorkspaceFavorites) {
        queryClient.setQueryData(
          favoriteKeys.workspaceList(workspaceSlug),
          context.previousWorkspaceFavorites,
        );
      }
    },
    onSuccess: (result, _variables, _context) => {
      dispatchDocumentSubdocCreatedEvent({
        parentDocumentId: document.id,
        workspaceSlug,
        childDocument: result.child_document,
      });
      markCachedFavoriteDocumentHasChildren(
        queryClient,
        workspaceSlug,
        document.id,
      );
      setExpandedDocumentIds(
        workspaceSlug,
        (expandedByWorkspace[workspaceSlug] ?? []).includes(document.id)
          ? (expandedByWorkspace[workspaceSlug] ?? [])
          : [...(expandedByWorkspace[workspaceSlug] ?? []), document.id],
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
      ]);
    },
  });

  return {
    createSubdocumentMutation,
    handleCreateSubdocument: () => {
      createSubdocumentMutation.mutate(undefined);
    },
  };
}
