'use client';

import { HTTPError } from 'ky';

import type { DocumentNavigationNode } from '@/domains/document';
import { useWorkspaceFavoritesQuery } from '@/domains/favorite';

import { DocumentTreeLoading } from '../document-tree/document-tree-loading';
import { DocumentTreeList } from '../document-tree/document-tree-list/document-tree-list';
import { CollapsibleSidebarGroup } from './collapsible-sidebar-group';

function toFavoriteDocumentNode(favorite: {
  document_id: string;
  public_id: string;
  title: string;
  teamspace_id?: string;
  parent_document_id?: string;
  sort_key: number;
  has_children: boolean;
  has_content: boolean;
}): DocumentNavigationNode {
  return {
    id: favorite.document_id,
    public_id: favorite.public_id,
    title: favorite.title,
    teamspace_id: favorite.teamspace_id,
    parent_document_id: favorite.parent_document_id,
    sort_key: favorite.sort_key,
    has_children: favorite.has_children,
    has_content: favorite.has_content,
    is_favorite: true,
  };
}

export function FavoritesDocumentsGroup({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const favoritesQuery = useWorkspaceFavoritesQuery(workspaceSlug);
  const favorites = favoritesQuery.data ?? [];
  const isEmptyFavoritesResponse =
    !favoritesQuery.isLoading
    && (
      (!favoritesQuery.isError && favorites.length === 0)
      || (favoritesQuery.error instanceof HTTPError && favoritesQuery.error.response.status === 404)
    );

  if (isEmptyFavoritesResponse) {
    return null;
  }

  return (
    <CollapsibleSidebarGroup label="Favorites">
      {favoritesQuery.isLoading ? <DocumentTreeLoading /> : null}
      {favoritesQuery.isError
        ? <p className="px-2 py-1 text-xs text-muted-foreground">Favorites unavailable.</p>
        : null}
      {!favoritesQuery.isLoading && !favoritesQuery.isError
        ? (
          <DocumentTreeList
            workspaceSlug={workspaceSlug}
            items={favorites.map(toFavoriteDocumentNode)}
            emptyMessage="No favorites yet."
          />
        )
        : null}
    </CollapsibleSidebarGroup>
  );
}
