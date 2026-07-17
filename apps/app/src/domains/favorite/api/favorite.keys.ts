import { createQueryKey } from '@shared/lib/api-client';

export const favoriteKeys = {
  all: () => createQueryKey('favorite'),
  workspaceList: (workspaceSlug: string) => createQueryKey('favorite', 'workspace', workspaceSlug),
  status: (documentId: string) => createQueryKey('favorite', 'status', documentId),
} as const;
