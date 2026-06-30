'use client';

import { useQuery } from '@tanstack/react-query';

import { documentDetailQueryOptions } from '../api/document.queries';
import type { Document, DocumentId } from '../api/document.types';

export function useDocumentQuery(documentId: DocumentId, initialData?: Document) {
  return useQuery({
    ...documentDetailQueryOptions(documentId),
    ...(initialData ? { initialData } : {}),
  });
}
