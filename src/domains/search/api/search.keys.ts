import { createQueryKey } from '@/lib/api-client';

export const searchKeys = {
  all: () => createQueryKey('search'),
  documents: (workspaceId: string, query: string, limit: number) =>
    createQueryKey('search', 'documents', workspaceId, query, limit),
} as const;
