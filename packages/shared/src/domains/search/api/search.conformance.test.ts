import {
  describe,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type { searchDocumentSchema } from '../../../../../../apps/app/src/domains/search/api/search.schemas';
import type { ApiSchema, paths } from '../../../api/contracts';

type SearchDocumentInferred = z.infer<typeof searchDocumentSchema>;

type SearchDocumentsResponse =
  paths['/v1/workspaces/{workspaceId}/search/documents']['get']['responses'][200]['content']['application/json'];

describe('search contract', () => {
  it('searchDocumentSchema matches SearchDocumentResponseDto', () => {
    // Every optional field on the runtime schema is optional in the contract
    // too, so the two shapes agree in both directions.
    expectTypeOf<SearchDocumentInferred>()
      .toEqualTypeOf<ApiSchema<'SearchDocumentResponseDto'>>();
    expectTypeOf<ApiSchema<'SearchDocumentResponseDto'>>()
      .toEqualTypeOf<SearchDocumentInferred>();
  });

  it('searchDocuments resolves to an array of SearchDocumentResponseDto', () => {
    expectTypeOf<SearchDocumentsResponse>()
      .toEqualTypeOf<ApiSchema<'SearchDocumentResponseDto'>[]>();
  });
});
