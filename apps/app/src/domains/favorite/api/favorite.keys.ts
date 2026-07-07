import { createQueryKey } from '@shared/lib/api-client';

export const favoriteKeys = {
  all: () => createQueryKey('favorite'),
  workspaceList: (workspaceId: string) => createQueryKey('favorite', 'workspace', workspaceId),
  status: (documentId: string) => createQueryKey('favorite', 'status', documentId),
} as const;
