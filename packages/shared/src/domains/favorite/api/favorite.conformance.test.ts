import {
  describe,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type {
  favoriteDocumentAccessSchema,
  favoriteDocumentSchema,
  favoriteStatusSchema,
} from '../../../../../../apps/app/src/domains/favorite/api/favorite.schemas';
import type { ApiSchema, paths } from '../../../api/contracts';

type FavoriteStatusInferred = z.infer<typeof favoriteStatusSchema>;
type FavoriteDocumentAccessInferred = z.infer<typeof favoriteDocumentAccessSchema>;
type FavoriteDocumentInferred = z.infer<typeof favoriteDocumentSchema>;

type FavoriteListResponse =
  paths['/v1/workspaces/{workspaceId}/favorites']['get']['responses'][200]['content']['application/json'];
type FavoriteStatusResponse =
  paths['/v1/documents/{documentId}/favorite']['get']['responses'][200]['content']['application/json'];
type FavoriteDocumentResponse =
  paths['/v1/documents/{documentId}/favorite']['post']['responses'][201]['content']['application/json'];
type UnfavoriteDocumentResponse =
  paths['/v1/documents/{documentId}/favorite']['delete']['responses'][200]['content']['application/json'];

describe('favorite contract', () => {
  it('favoriteStatusSchema matches FavoriteStatusResponseDto', () => {
    expectTypeOf<FavoriteStatusInferred>()
      .toEqualTypeOf<ApiSchema<'FavoriteStatusResponseDto'>>();
    expectTypeOf<ApiSchema<'FavoriteStatusResponseDto'>>()
      .toEqualTypeOf<FavoriteStatusInferred>();
  });

  it('favoriteDocumentAccessSchema matches FavoriteDocumentAccessResponseDto', () => {
    expectTypeOf<FavoriteDocumentAccessInferred>()
      .toEqualTypeOf<ApiSchema<'FavoriteDocumentAccessResponseDto'>>();
    expectTypeOf<ApiSchema<'FavoriteDocumentAccessResponseDto'>>()
      .toEqualTypeOf<FavoriteDocumentAccessInferred>();
  });

  it('favoriteDocumentSchema matches FavoriteDocumentResponseDto', () => {
    // Both sides declare `teamspace_id` and `parent_document_id` optional, so
    // the contract and the runtime schema agree in both directions.
    expectTypeOf<FavoriteDocumentInferred>()
      .toEqualTypeOf<ApiSchema<'FavoriteDocumentResponseDto'>>();
    expectTypeOf<ApiSchema<'FavoriteDocumentResponseDto'>>()
      .toEqualTypeOf<FavoriteDocumentInferred>();
  });

  it('favorite operations resolve to the favorite DTOs', () => {
    expectTypeOf<FavoriteListResponse>()
      .toEqualTypeOf<ApiSchema<'FavoriteDocumentResponseDto'>[]>();
    expectTypeOf<FavoriteStatusResponse>()
      .toEqualTypeOf<ApiSchema<'FavoriteStatusResponseDto'>>();
    expectTypeOf<FavoriteDocumentResponse>()
      .toEqualTypeOf<ApiSchema<'FavoriteStatusResponseDto'>>();
    expectTypeOf<UnfavoriteDocumentResponse>()
      .toEqualTypeOf<ApiSchema<'FavoriteStatusResponseDto'>>();
  });
});
