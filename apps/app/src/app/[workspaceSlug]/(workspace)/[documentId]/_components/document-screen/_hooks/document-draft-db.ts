'use client';

import Dexie, { type EntityTable } from 'dexie';

export type DraftSyncState =
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'conflict';

export type DocumentDraftRecord = {
  id: string;
  workspaceSlug: string;
  documentId: string;
  content: unknown[];
  baseVersion: number;
  updatedAt: number;
  syncState: DraftSyncState;
  lastError?: string;
};

type DraftDatabase = Dexie & {
  documentDrafts: EntityTable<DocumentDraftRecord, 'id'>;
};

export const documentDraftDb = new Dexie('camilleDrafts') as DraftDatabase;

documentDraftDb.version(1).stores({
  documentDrafts: 'id, workspaceSlug, documentId, syncState, updatedAt',
});
