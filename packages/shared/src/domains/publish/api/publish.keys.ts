import { createQueryKey } from '../../../lib/api-client';

export const publishKeys = {
  all: () => createQueryKey('publish'),
  status: (documentId: string) => createQueryKey('publish', 'status', documentId),
} as const;
