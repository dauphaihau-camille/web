import {
  clearDocumentCollaborationStorageForOwner,
  clearDocumentCollaborationStorageForUser,
  documentCollaborationChannelName,
  documentCollaborationStorageName,
  documentCollaborationStoragePrefix,
} from './document-collaboration.constants';

describe('document collaboration resource names', () => {
  function createIndexedDbMock() {
    const deletedDatabaseNames: string[] = [];
    const indexedDb = {
      databases: async () => [
        { name: 'camille:workspace:workspace-1:user:user-1:document:document-1' },
        { name: 'camille:workspace:workspace-1:user:user-1:document:document-2' },
        { name: 'camille:workspace:workspace-1:user:user-2:document:document-1' },
        { name: 'camille:workspace:workspace-2:user:user-1:document:document-1' },
        { name: 'other-storage' },
      ],
      deleteDatabase: (databaseName: string) => {
        deletedDatabaseNames.push(databaseName);
        const request = {};

        queueMicrotask(() => {
          (request as { onsuccess?: () => void }).onsuccess?.();
        });

        return request;
      },
    };

    return {
      deletedDatabaseNames,
      indexedDb: indexedDb as never,
    };
  }

  it('scopes IndexedDB persistence to workspace, user, and document', () => {
    expect(documentCollaborationStorageName({
      documentId: 'document-1',
      userId: 'user-1',
      workspaceId: 'workspace-1',
    })).toBe('camille:workspace:workspace-1:user:user-1:document:document-1');
  });

  it('scopes the local-tab channel to workspace, user, and document', () => {
    expect(documentCollaborationChannelName({
      documentId: 'document-1',
      userId: 'user-1',
      workspaceId: 'workspace-1',
    })).toBe('camille:workspace:workspace-1:user:user-1:document:document-1');
  });

  it('builds an owner-specific storage prefix', () => {
    expect(documentCollaborationStoragePrefix({
      userId: 'user-1',
      workspaceId: 'workspace-1',
    })).toBe('camille:workspace:workspace-1:user:user-1:document:');
  });

  it('clears only collaboration databases for the current workspace and user', async () => {
    const { deletedDatabaseNames, indexedDb } = createIndexedDbMock();

    await clearDocumentCollaborationStorageForOwner({
      userId: 'user-1',
      workspaceId: 'workspace-1',
    }, indexedDb);

    expect(deletedDatabaseNames).toEqual([
      'camille:workspace:workspace-1:user:user-1:document:document-1',
      'camille:workspace:workspace-1:user:user-1:document:document-2',
    ]);
  });

  it('clears collaboration databases for the current user across workspaces', async () => {
    const { deletedDatabaseNames, indexedDb } = createIndexedDbMock();

    await clearDocumentCollaborationStorageForUser('user-1', indexedDb);

    expect(deletedDatabaseNames).toEqual([
      'camille:workspace:workspace-1:user:user-1:document:document-1',
      'camille:workspace:workspace-1:user:user-1:document:document-2',
      'camille:workspace:workspace-2:user:user-1:document:document-1',
    ]);
  });
});
