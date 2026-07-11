'use client';

import type { QueryClient } from '@tanstack/react-query';

import {
  documentDetailQueryOptions,
  workspaceDocumentChildrenQueryOptions,
  workspaceDocumentRootQueryOptions,
} from '../api/document.queries';
import type {
  Document,
  DocumentNavigationNode,
  WorkspaceDocumentNavigation,
} from '../api/document.types';

function orderDocuments(items: DocumentNavigationNode[]) {
  return [...items].sort((left, right) => right.sort_key - left.sort_key);
}

export function getNearestDocument(
  items: DocumentNavigationNode[],
  currentDocumentId: string,
) {
  const orderedItems = orderDocuments(items);
  const currentIndex = orderedItems.findIndex(
    (item) => item.id === currentDocumentId,
  );

  if (currentIndex === -1) {
    return orderedItems[0] ?? null;
  }

  return (
    orderedItems[currentIndex - 1] ?? orderedItems[currentIndex + 1] ?? null
  );
}

export function getRootNavigationItems(
  navigation: WorkspaceDocumentNavigation,
  teamspaceId?: string,
) {
  if (!teamspaceId) {
    return navigation.private_documents.items;
  }

  return (
    navigation.teamspaces.find((teamspace) => teamspace.id === teamspaceId)
      ?.documents.items ?? []
  );
}

export async function resolveArchiveDestination({
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
      workspaceDocumentChildrenQueryOptions(
        workspaceSlug,
        document.parent_document_id,
      ),
    );
    const siblingDocument = getNearestDocument(siblingPage.items, document.id);

    if (siblingDocument) {
      return siblingDocument;
    }

    return queryClient.ensureQueryData(
      documentDetailQueryOptions(document.parent_document_id),
    );
  }

  const rootNavigation = await queryClient.ensureQueryData(
    workspaceDocumentRootQueryOptions(workspaceSlug),
  );
  const rootItems = getRootNavigationItems(
    rootNavigation,
    document.teamspace_id,
  );

  return getNearestDocument(rootItems, document.id);
}
