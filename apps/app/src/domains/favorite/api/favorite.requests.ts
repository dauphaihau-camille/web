import { apiDelete, apiGet, apiPost } from '@shared/lib/api-client';
import type { ApiSuccess } from '@shared/api/contracts';
import {
  favoriteDocumentSchema,
  favoriteStatusSchema,
} from './favorite.schemas';
import type {
  FavoriteDocument,
  FavoriteStatus,
} from './favorite.types';

export async function getWorkspaceFavorites(workspaceSlug: string): Promise<FavoriteDocument[]> {
  const response = await apiGet<
    ApiSuccess<'/v1/workspaces/{workspaceId}/favorites', 'get'>
  >(`workspaces/${workspaceSlug}/favorites`);

  return favoriteDocumentSchema.array().parse(response);
}

export async function getFavoriteStatus(documentId: string): Promise<FavoriteStatus> {
  const response = await apiGet<
    ApiSuccess<'/v1/documents/{documentId}/favorite', 'get'>
  >(`documents/${documentId}/favorite`);

  return favoriteStatusSchema.parse(response);
}

export async function favoriteDocument(documentId: string): Promise<FavoriteStatus> {
  const response = await apiPost<
    ApiSuccess<'/v1/documents/{documentId}/favorite', 'post', 201>
  >(`documents/${documentId}/favorite`);

  return favoriteStatusSchema.parse(response);
}

export async function unfavoriteDocument(documentId: string): Promise<FavoriteStatus> {
  const response = await apiDelete<
    ApiSuccess<'/v1/documents/{documentId}/favorite', 'delete'>
  >(`documents/${documentId}/favorite`);

  return favoriteStatusSchema.parse(response);
}
