'use client';

import { HTTPError } from 'ky';

import type { DocumentNavigationNode } from '@/domains/document';
import type { FavoriteDocument } from '@/domains/favorite';
import { useWorkspaceFavoritesQuery } from '@/domains/favorite';
import type { DocumentTreeNodeActionMode } from '../document-tree/document-tree-list/document-tree-node/document-tree-node';

import { DocumentTreeSkeleton } from '../workspace-skeleton/document-tree-skeleton';
import { DocumentTreeList } from '../document-tree/document-tree-list/document-tree-list';
import { CollapsibleSidebarGroup } from './collapsible-sidebar-group';

function toFavoriteDocumentNode(favorite: FavoriteDocument): DocumentNavigationNode {
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

function resolveFavoriteDocumentActionMode(
  favorite: FavoriteDocument,
): DocumentTreeNodeActionMode {
  return favorite.access.can_edit ? 'full' : 'readOnly';
}

export function FavoritesDocumentsGroup({
  workspaceSlug,
  favoritesQuery: favoritesQueryProp,
}: {
  workspaceSlug: string;
  favoritesQuery?: ReturnType<typeof useWorkspaceFavoritesQuery>;
}) {
  const localFavoritesQuery = useWorkspaceFavoritesQuery(workspaceSlug);
  const favoritesQuery = favoritesQueryProp ?? localFavoritesQuery;
  const favorites = favoritesQuery.data ?? [];

  const favoriteByDocumentId = new Map(
    favorites.map((favorite) => [favorite.document_id, favorite]),
  );

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
      {favoritesQuery.isLoading ? <DocumentTreeSkeleton /> : null}
      {favoritesQuery.isError
        ? <p className="px-2 py-1 text-xs text-muted-foreground">Favorites unavailable.</p>
        : null}
      {!favoritesQuery.isLoading && !favoritesQuery.isError
        ? (
          <DocumentTreeList
            workspaceSlug={workspaceSlug}
            items={favorites.map(toFavoriteDocumentNode)}
            emptyMessage="No favorites yet."
            getActionMode={(document) => {
              const favorite = favoriteByDocumentId.get(document.id);

              return favorite ? resolveFavoriteDocumentActionMode(favorite) : 'readOnly';
            }}
          />
        )
        : null}
    </CollapsibleSidebarGroup>
  );
}
