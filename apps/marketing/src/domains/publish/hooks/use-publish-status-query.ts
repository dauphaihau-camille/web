'use client';

import { useQuery } from '@tanstack/react-query';
import { publishStatusQueryOptions } from '../api/publish.queries';

export function usePublishStatusQuery(documentId: string) {
  return useQuery(publishStatusQueryOptions(documentId));
}
