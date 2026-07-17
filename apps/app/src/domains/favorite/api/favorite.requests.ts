import { apiDelete, apiGet, apiPost } from '@shared/lib/api-client';
import {
  favoriteDocumentSchema,
  favoriteStatusSchema,
} from './favorite.schemas';
import type {
  FavoriteDocument,
  FavoriteStatus,
} from './favorite.types';

export async function getWorkspaceFavorites(workspaceSlug: string): Promise<FavoriteDocument[]> {
  const response = await apiGet<unknown>(`workspaces/${workspaceSlug}/favorites`);

  return favoriteDocumentSchema.array().parse(response);
}

export async function getFavoriteStatus(documentId: string): Promise<FavoriteStatus> {
  const response = await apiGet<unknown>(`documents/${documentId}/favorite`);

  return favoriteStatusSchema.parse(response);
}

export async function favoriteDocument(documentId: string): Promise<FavoriteStatus> {
  const response = await apiPost<unknown>(`documents/${documentId}/favorite`);

  return favoriteStatusSchema.parse(response);
}

export async function unfavoriteDocument(documentId: string): Promise<FavoriteStatus> {
  const response = await apiDelete<unknown>(`documents/${documentId}/favorite`);

  return favoriteStatusSchema.parse(response);
}
