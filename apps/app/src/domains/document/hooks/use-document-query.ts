'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { documentDetailQueryOptions } from '../api/document.queries';
import type { Document, DocumentId } from '../api/document.types';

type UseDocumentQueryOptions = Pick<
  UseQueryOptions<Document>,
  'enabled' | 'initialData' | 'initialDataUpdatedAt' | 'refetchOnMount'
>;

export function useDocumentQuery(documentId: DocumentId, options?: UseDocumentQueryOptions) {
  return useQuery({
    ...documentDetailQueryOptions(documentId),
    ...options,
  });
}
