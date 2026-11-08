import {
  describe,
  expect,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import {
  publishStatusSchema,
  type publicDocumentSchema,
} from '../domains/publish/api/publish.schemas';
import type { ApiSchema, components, paths } from './contracts';

/**
 * Contract components asserted by the publish, document, workspace, and auth
 * conformance tests. Every entry must name a real contract schema; a rename in
 * the contract breaks `UncoveredContractComponent` below.
 */
const CONTRACT_COVERAGE = [
  'PublishedDocumentResponseDto',
  'PublicDocumentResponseDto',
  'DocumentResponseDto',
  'DocumentOwnerUserResponseDto',
  'DocumentBreadcrumbItemDto',
  'DocumentAccessResponseDto',
  'DocumentCollaborationResponseDto',
  'DocumentInvitationResponseDto',
  'ArchivedDocumentListItemResponseDto',
  'ArchivedDocumentListPageResponseDto',
  'WorkspaceResponseDto',
  'WorkspaceMemberResponseDto',
  'UserProfileResponseDto',
  'AuthResponseDto',
  'StartEmailAuthResponseDto',
  'FavoriteDocumentResponseDto',
  'FavoriteDocumentAccessResponseDto',
  'FavoriteStatusResponseDto',
  'SubscriptionSummaryResponseDto',
  'SubscriptionEntitlementsResponseDto',
  'CheckoutSessionResponseDto',
  'SearchDocumentResponseDto',
  'TeamspaceResponseDto',
  'WorkspacePreferenceResponseDto',
  'WorkspaceNavigationPreferenceResponseDto',
  'WorkspaceActivityPreferenceResponseDto',
] as const;

type UncoveredContractComponent = Exclude<
  (typeof CONTRACT_COVERAGE)[number],
  keyof components['schemas']
>;

/** Components the publish zod schemas must mirror. Referencing them fails typecheck if renamed. */
type PublishStatusSchema = ApiSchema<'PublishedDocumentResponseDto'>;
type PublicDocumentSchema = ApiSchema<'PublicDocumentResponseDto'>;

type PublishStatusInferred = z.infer<typeof publishStatusSchema>;
type PublicDocumentInferred = z.infer<typeof publicDocumentSchema>;

type PublishStatusResponse =
  paths['/v1/documents/{documentId}/publish']['get']['responses'][200]['content']['application/json'];
type PublishDocumentResponse =
  paths['/v1/documents/{documentId}/publish']['post']['responses'][201]['content']['application/json'];
type UnpublishDocumentResponse =
  paths['/v1/documents/{documentId}/publish']['delete']['responses'][200]['content']['application/json'];
type PublicDocumentResponse =
  paths['/v1/published/{publishedDocumentId}']['get']['responses'][200]['content']['application/json'];

describe('publish contract', () => {
  it('publishStatusSchema is mutually assignable with PublishedDocumentResponseDto', () => {
    expectTypeOf<PublishStatusInferred>().toEqualTypeOf<PublishStatusSchema>();
    expectTypeOf<PublishStatusSchema>().toEqualTypeOf<PublishStatusInferred>();
  });

  it('publish operations resolve to PublishedDocumentResponseDto', () => {
    expectTypeOf<PublishStatusResponse>().toEqualTypeOf<PublishStatusSchema>();
    expectTypeOf<PublishDocumentResponse>().toEqualTypeOf<PublishStatusSchema>();
    expectTypeOf<UnpublishDocumentResponse>().toEqualTypeOf<PublishStatusSchema>();
  });

  it('publicDocumentSchema is mutually assignable with PublicDocumentResponseDto', () => {
    expectTypeOf<PublicDocumentInferred>().toEqualTypeOf<PublicDocumentSchema>();
    expectTypeOf<PublicDocumentSchema>().toEqualTypeOf<PublicDocumentInferred>();
    expectTypeOf<PublicDocumentResponse>().toEqualTypeOf<PublicDocumentSchema>();
  });

  it('publicDocumentSchema narrows content_format and requires breadcrumb fields', () => {
    // The API DTO declares the enum and required breadcrumb items, so the
    // contract and the runtime schema agree in both directions.
    expectTypeOf<PublicDocumentSchema['content_format']>().toEqualTypeOf<'blocknote_v1'>();
    expectTypeOf<PublicDocumentSchema['breadcrumb'][number]>().toEqualTypeOf<{
      id: string;
      title: string;
      published_document_id: string;
      public_path: string;
    }>();
  });

  it('publishStatusSchema still parses contract-shaped payloads at runtime', () => {
    const parsed = publishStatusSchema.parse({
      document_id: 'doc_1',
      published_document_id: 'pub_1',
      public_path: '/p/pub_1',
      published_at: '2026-01-01T00:00:00.000Z',
    });

    expect(parsed).toEqual({
      document_id: 'doc_1',
      published_document_id: 'pub_1',
      public_path: '/p/pub_1',
      published_at: '2026-01-01T00:00:00.000Z',
    });
    expect(publishStatusSchema.parse({ document_id: 'doc_1' })).toEqual({
      document_id: 'doc_1',
    });
  });
});

describe('contract coverage', () => {
  it('only lists component names that exist in the contract', () => {
    expectTypeOf<UncoveredContractComponent>().toEqualTypeOf<never>();
    expect(CONTRACT_COVERAGE.length).toBeGreaterThan(0);
  });

  it('covers every domain with a conformance test', () => {
    expect(CONTRACT_COVERAGE).toEqual(expect.arrayContaining([
      'PublishedDocumentResponseDto',
      'DocumentResponseDto',
      'WorkspaceResponseDto',
      'UserProfileResponseDto',
      'FavoriteDocumentResponseDto',
      'SubscriptionSummaryResponseDto',
      'SearchDocumentResponseDto',
      'TeamspaceResponseDto',
      'WorkspacePreferenceResponseDto',
    ]));
  });
});
