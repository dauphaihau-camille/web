import { createQueryKey } from '@shared/lib/api-client';

export const workspacePreferenceKeys = {
  all: createQueryKey('workspace-preferences'),
  detail: (workspaceId: string) =>
    createQueryKey(...workspacePreferenceKeys.all, workspaceId),
};
