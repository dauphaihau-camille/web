'use client';

import { documentDraftDb, type DocumentDraftRecord } from './document-draft-db';

const PENDING_STATES = ['pending', 'failed', 'conflict'] as const;
const STALE_DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export function getDocumentDraftId(workspaceSlug: string, documentId: string) {
  return `${workspaceSlug}:${documentId}`;
}

export async function loadDocumentDraft(id: string) {
  return documentDraftDb.documentDrafts.get(id);
}

export async function saveDocumentDraft(record: DocumentDraftRecord) {
  await documentDraftDb.documentDrafts.put(record);
}

export async function markDocumentDraftSyncing(id: string) {
  await documentDraftDb.documentDrafts.update(id, {
    syncState: 'syncing',
    lastError: undefined,
  });
}

export async function markDocumentDraftFailed(id: string, error: string) {
  await documentDraftDb.documentDrafts.update(id, {
    syncState: 'failed',
    lastError: error,
    updatedAt: Date.now(),
  });
}

export async function deleteDocumentDraft(id: string) {
  await documentDraftDb.documentDrafts.delete(id);
}

export async function listPendingDocumentDrafts() {
  return documentDraftDb.documentDrafts
    .where('syncState')
    .anyOf(PENDING_STATES)
    .toArray();
}

export async function cleanupStaleDocumentDrafts(now = Date.now()) {
  const staleDrafts = await documentDraftDb.documentDrafts
    .where('updatedAt')
    .below(now - STALE_DRAFT_TTL_MS)
    .primaryKeys();

  if (staleDrafts.length === 0) {
    return;
  }

  await documentDraftDb.documentDrafts.bulkDelete(staleDrafts);
}
