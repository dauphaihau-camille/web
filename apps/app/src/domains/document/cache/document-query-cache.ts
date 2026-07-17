'use client';

import type { QueryClient } from '@tanstack/react-query';

import { hasMeaningfulContent } from '@shared/components/editor/has-meaningful-content';
import {
  documentKeys,
  type Document,
  type DocumentNavigationNode,
  type DocumentNavigationPage,
  type WorkspaceDocumentNavigation,
} from '@/domains/document';

export type UpdatedReferencedSubdocDocument = {
  content: unknown[];
  documentId: string;
  version: number;
};

function isWorkspaceNavigation(
  value: WorkspaceDocumentNavigation | DocumentNavigationPage | undefined,
): value is WorkspaceDocumentNavigation {
  return Boolean(
    value
    && 'private_documents' in value
    && 'teamspaces' in value,
  );
}

function updateNavigationPageItem(
  page: DocumentNavigationPage,
  documentId: string,
  update: (item: DocumentNavigationNode) => DocumentNavigationNode,
): DocumentNavigationPage {
  return {
    ...page,
    items: page.items.map((item) => (item.id === documentId ? update(item) : item)),
  };
}

function updateWorkspaceNavigationItem(
  navigation: WorkspaceDocumentNavigation,
  documentId: string,
  update: (item: DocumentNavigationNode) => DocumentNavigationNode,
): WorkspaceDocumentNavigation {
  return {
    ...navigation,
    private_documents: updateNavigationPageItem(
      navigation.private_documents,
      documentId,
      update,
    ),
    teamspaces: navigation.teamspaces.map((teamspace) => ({
      ...teamspace,
      documents: updateNavigationPageItem(teamspace.documents, documentId, update),
    })),
  };
}

function buildDocumentNavigationNode(document: Document): DocumentNavigationNode {
  return {
    id: document.id,
    public_id: document.public_id,
    title: document.title,
    teamspace_id: document.teamspace_id,
    parent_document_id: document.parent_document_id,
    sort_key: document.sort_key,
    has_children: false,
    has_content: hasMeaningfulContent(document.content),
    is_favorite: false,
  };
}

function isUnfilteredRootListKey(queryKey: readonly unknown[]) {
  return (
    queryKey.at(-4) === 'root'
    && queryKey.at(-2) === null
    && queryKey.at(-1) === null
  );
}

export function updateCachedNavigationTitle(
  queryClient: QueryClient,
  workspaceSlug: string,
  documentId: string,
  nextTitle: string,
) {
  queryClient.setQueriesData<WorkspaceDocumentNavigation | DocumentNavigationPage>(
    { queryKey: documentKeys.lists(workspaceSlug) },
    (currentNavigation) => {
      if (isWorkspaceNavigation(currentNavigation)) {
        return updateWorkspaceNavigationItem(currentNavigation, documentId, (item) => ({
          ...item,
          title: nextTitle,
        }));
      }

      if (!currentNavigation) {
        return currentNavigation;
      }

      return updateNavigationPageItem(currentNavigation, documentId, (item) => ({
        ...item,
        title: nextTitle,
      }));
    },
  );
}

export function updateCachedNavigationContentStatus(
  queryClient: QueryClient,
  workspaceSlug: string,
  documentId: string,
  hasContent: boolean,
) {
  queryClient.setQueriesData<WorkspaceDocumentNavigation | DocumentNavigationPage>(
    { queryKey: documentKeys.lists(workspaceSlug) },
    (currentNavigation) => {
      if (isWorkspaceNavigation(currentNavigation)) {
        return updateWorkspaceNavigationItem(currentNavigation, documentId, (item) => ({
          ...item,
          has_content: hasContent,
        }));
      }

      if (!currentNavigation) {
        return currentNavigation;
      }

      return updateNavigationPageItem(currentNavigation, documentId, (item) => ({
        ...item,
        has_content: hasContent,
      }));
    },
  );
}

export function updateCachedNavigationFavoriteStatus(
  queryClient: QueryClient,
  workspaceSlug: string,
  documentId: string,
  isFavorite: boolean,
) {
  queryClient.setQueriesData<WorkspaceDocumentNavigation | DocumentNavigationPage>(
    { queryKey: documentKeys.lists(workspaceSlug) },
    (currentNavigation) => {
      if (isWorkspaceNavigation(currentNavigation)) {
        return updateWorkspaceNavigationItem(currentNavigation, documentId, (item) => ({
          ...item,
          is_favorite: isFavorite,
        }));
      }

      if (!currentNavigation) {
        return currentNavigation;
      }

      return updateNavigationPageItem(currentNavigation, documentId, (item) => ({
        ...item,
        is_favorite: isFavorite,
      }));
    },
  );
}

export function markCachedNavigationNodeHasChildren(
  queryClient: QueryClient,
  workspaceSlug: string,
  documentId: string,
) {
  queryClient.setQueriesData<WorkspaceDocumentNavigation | DocumentNavigationPage>(
    { queryKey: documentKeys.lists(workspaceSlug) },
    (currentNavigation) => {
      if (isWorkspaceNavigation(currentNavigation)) {
        return updateWorkspaceNavigationItem(currentNavigation, documentId, (item) => ({
          ...item,
          has_children: true,
        }));
      }

      if (!currentNavigation) {
        return currentNavigation;
      }

      return updateNavigationPageItem(currentNavigation, documentId, (item) => ({
        ...item,
        has_children: true,
      }));
    },
  );
}

export function removeCachedNavigationDocument(
  queryClient: QueryClient,
  workspaceSlug: string,
  documentId: string,
) {
  queryClient.setQueriesData<WorkspaceDocumentNavigation | DocumentNavigationPage>(
    { queryKey: documentKeys.lists(workspaceSlug) },
    (currentNavigation) => {
      if (isWorkspaceNavigation(currentNavigation)) {
        return {
          ...currentNavigation,
          private_documents: {
            ...currentNavigation.private_documents,
            items: currentNavigation.private_documents.items.filter((item) => item.id !== documentId),
          },
          teamspaces: currentNavigation.teamspaces.map((teamspace) => ({
            ...teamspace,
            documents: {
              ...teamspace.documents,
              items: teamspace.documents.items.filter((item) => item.id !== documentId),
            },
          })),
        };
      }

      if (!currentNavigation) {
        return currentNavigation;
      }

      return {
        ...currentNavigation,
        items: currentNavigation.items.filter((item) => item.id !== documentId),
      };
    },
  );
}

export function insertCreatedPrivateRootDocument(
  queryClient: QueryClient,
  workspaceSlug: string,
  document: Document,
) {
  const documentNode = buildDocumentNavigationNode(document);

  for (const [
    queryKey,
    currentNavigation,
  ] of queryClient.getQueriesData<WorkspaceDocumentNavigation>({
      queryKey: [...documentKeys.lists(workspaceSlug), 'root'],
    })) {
    if (!currentNavigation || !isUnfilteredRootListKey(queryKey)) {
      continue;
    }

    queryClient.setQueryData<WorkspaceDocumentNavigation>(queryKey, {
      ...currentNavigation,
      private_documents: {
        ...currentNavigation.private_documents,
        items: [documentNode, ...currentNavigation.private_documents.items]
          .filter(
            (item, index, items) =>
              items.findIndex((candidate) => candidate.id === item.id) === index,
          )
          .sort((left, right) => left.sort_key - right.sort_key),
      },
    });
  }
}

export function updateCachedReferencedSubdocTitles(
  queryClient: QueryClient,
  documentId: string,
  nextTitle: string,
): UpdatedReferencedSubdocDocument[] {
  const replaceSubdocTitleInContent = (content: unknown[]): unknown[] => {
    let changed = false;

    const replaceInBlock = (value: unknown): unknown => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value;
      }

      const block = value as {
        type?: unknown;
        props?: unknown;
        children?: unknown;
      };

      let nextBlock = block;

      if (
        block.type === 'subdoc'
        && block.props
        && typeof block.props === 'object'
        && !Array.isArray(block.props)
        && (block.props as { documentId?: unknown }).documentId === documentId
        && (block.props as { title?: unknown }).title !== nextTitle
      ) {
        changed = true;
        nextBlock = {
          ...block,
          props: {
            ...(block.props as Record<string, unknown>),
            title: nextTitle,
          },
        };
      }

      if (Array.isArray(nextBlock.children) && nextBlock.children.length > 0) {
        const currentChildren = nextBlock.children;
        const nextChildren = currentChildren.map(replaceInBlock);

        if (nextChildren.some((child, index) => child !== currentChildren[index])) {
          nextBlock = {
            ...nextBlock,
            children: nextChildren,
          };
        }
      }

      return nextBlock;
    };

    const nextContent = content.map(replaceInBlock);

    return changed ? nextContent : content;
  };

  const updatedDocuments: UpdatedReferencedSubdocDocument[] = [];
  const cachedDocuments = queryClient.getQueriesData<Document>({
    queryKey: [...documentKeys.all, 'detail'],
  });

  for (const [queryKey, currentDocument] of cachedDocuments) {
    if (!currentDocument || currentDocument.id === documentId) {
      continue;
    }

    const nextContent = replaceSubdocTitleInContent(currentDocument.content);

    if (nextContent === currentDocument.content) {
      continue;
    }

    updatedDocuments.push({
      content: nextContent,
      documentId: currentDocument.id,
      version: currentDocument.version,
    });

    queryClient.setQueryData<Document>(queryKey, {
      ...currentDocument,
      content: nextContent,
    });
  }

  return updatedDocuments;
}

export function insertCreatedSubdocIntoCachedChildren(
  queryClient: QueryClient,
  workspaceSlug: string,
  parentDocumentId: string,
  childDocument: Document,
) {
  const childNode = buildDocumentNavigationNode(childDocument);

  queryClient.setQueriesData<DocumentNavigationPage>(
    {
      queryKey: [...documentKeys.lists(workspaceSlug), 'children', parentDocumentId],
    },
    (currentPage) => {
      if (!currentPage) {
        return currentPage;
      }

      const itemsWithoutChild = currentPage.items.filter((item) => item.id !== childNode.id);

      return {
        ...currentPage,
        items: [childNode, ...itemsWithoutChild].sort(
          (left, right) => right.sort_key - left.sort_key,
        ),
      };
    },
  );
}
