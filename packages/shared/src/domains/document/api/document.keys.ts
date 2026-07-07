import { createQueryKey } from '../../../lib/api-client';

import type { DocumentId, WorkspaceId } from './document.types';

export const documentKeys = {
  all: createQueryKey('documents'),
  detail: (documentId: DocumentId) => createQueryKey(...documentKeys.all, 'detail', documentId),
  tree: (workspaceId: WorkspaceId) => createQueryKey(...documentKeys.all, 'tree', workspaceId),
  lists: (workspaceId: WorkspaceId) => createQueryKey(...documentKeys.all, 'list', workspaceId),
  rootList: (workspaceId: WorkspaceId, limit: number, cursor?: string, query?: string) =>
    createQueryKey(...documentKeys.lists(workspaceId), 'root', limit, cursor ?? null, query ?? null),
  childList: (
    workspaceId: WorkspaceId,
    parentDocumentId: DocumentId,
    limit: number,
    cursor?: string,
  ) => createQueryKey(
    ...documentKeys.lists(workspaceId),
    'children',
    parentDocumentId,
    limit,
    cursor ?? null,
  ),
};
