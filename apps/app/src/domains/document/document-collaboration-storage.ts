export type DocumentCollaborationNamespace = {
  documentId: string;
  userId: string;
  workspaceId: string;
};

type CollaborationStorageOwner = Omit<DocumentCollaborationNamespace, 'documentId'>;

type IndexedDbWithDatabases = IDBFactory & {
  databases?: () => Promise<Array<{ name?: string }>>;
};

export function documentCollaborationStoragePrefix({
  userId,
  workspaceId,
}: CollaborationStorageOwner): string {
  return `camille:workspace:${workspaceId}:user:${userId}:document:`;
}

export function documentCollaborationStorageName({
  documentId,
  userId,
  workspaceId,
}: DocumentCollaborationNamespace): string {
  return `${documentCollaborationStoragePrefix({
    userId,
    workspaceId,
  })}${documentId}`;
}

export function documentCollaborationChannelName(
  namespace: DocumentCollaborationNamespace,
): string {
  return documentCollaborationStorageName(namespace);
}

export async function clearDocumentCollaborationStorageForOwner(
  owner: CollaborationStorageOwner,
  indexedDb: IndexedDbWithDatabases | undefined =
    typeof indexedDB === 'undefined' ? undefined : indexedDB,
): Promise<void> {
  if (!indexedDb?.databases) {
    return;
  }

  const storagePrefix = documentCollaborationStoragePrefix(owner);
  const matchingDatabaseNames = await findDocumentCollaborationDatabaseNames(
    indexedDb,
    (databaseName) => databaseName.startsWith(storagePrefix),
  );

  await deleteIndexedDbDatabases(indexedDb, matchingDatabaseNames);
}

export async function clearDocumentCollaborationStorageForUser(
  userId: string,
  indexedDb: IndexedDbWithDatabases | undefined =
    typeof indexedDB === 'undefined' ? undefined : indexedDB,
): Promise<void> {
  if (!indexedDb?.databases) {
    return;
  }

  const userStorageMarker = `:user:${userId}:document:`;
  const matchingDatabaseNames = await findDocumentCollaborationDatabaseNames(
    indexedDb,
    (databaseName) =>
      databaseName.startsWith('camille:workspace:')
      && databaseName.includes(userStorageMarker),
  );

  await deleteIndexedDbDatabases(indexedDb, matchingDatabaseNames);
}

async function findDocumentCollaborationDatabaseNames(
  indexedDb: IndexedDbWithDatabases,
  predicate: (databaseName: string) => boolean,
): Promise<string[]> {
  const databases = await indexedDb.databases?.() ?? [];

  return databases
    .map((database) => database.name)
    .filter((name): name is string =>
      typeof name === 'string' && predicate(name));
}

async function deleteIndexedDbDatabases(
  indexedDb: IDBFactory,
  databaseNames: string[],
): Promise<void> {
  await Promise.all(databaseNames.map((databaseName) =>
    deleteIndexedDbDatabase(indexedDb, databaseName)));
}

function deleteIndexedDbDatabase(
  indexedDb: IDBFactory,
  databaseName: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDb.deleteDatabase(databaseName);

    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
    request.onsuccess = () => resolve();
  });
}
