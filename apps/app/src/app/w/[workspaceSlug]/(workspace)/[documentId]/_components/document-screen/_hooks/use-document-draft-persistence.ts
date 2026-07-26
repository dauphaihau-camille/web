'use client';

import { useEffect, useRef } from 'react';

import type { Document } from '@/domains/document';

import { normalizeBlockNoteContent } from '../editor/normalize-blocknote-content';
import {
  cleanupStaleDocumentDrafts,
  deleteDocumentDraft,
  getDocumentDraftId,
  loadDocumentDraft,
  markDocumentDraftFailed,
  markDocumentDraftSyncing,
  saveDocumentDraft,
} from './document-draft-store';
import type { DocumentDraftRecord } from './document-draft-db';

type UseDocumentDraftPersistenceOptions = {
  enabled?: boolean;
  document: Document;
  workspaceSlug: string;
  onRestoreDraft: (content: unknown[]) => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Failed to save document';
}

function isSameContent(left: unknown[], right: unknown[]) {
  return JSON.stringify(normalizeBlockNoteContent(left)) === JSON.stringify(normalizeBlockNoteContent(right));
}

export function useDocumentDraftPersistence({
  enabled = true,
  document,
  workspaceSlug,
  onRestoreDraft,
}: UseDocumentDraftPersistenceOptions) {
  const draftId = getDocumentDraftId(workspaceSlug, document.id);
  const hasCheckedRecoveryRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void cleanupStaleDocumentDrafts();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (hasCheckedRecoveryRef.current) {
      return;
    }

    hasCheckedRecoveryRef.current = true;
    let isCancelled = false;

    const restoreDraftIfNeeded = async () => {
      const draft = await loadDocumentDraft(draftId);

      if (isCancelled || !draft) {
        return;
      }

      if (isSameContent(draft.content, document.content)) {
        await deleteDocumentDraft(draftId);
        return;
      }

      const hasServerVersionConflict = draft.baseVersion < document.version;

      const message = hasServerVersionConflict
        ? 'A local recovery draft was found, but the server version changed. Restore the local draft anyway?'
        : 'A local recovery draft was found for this document. Restore it?';

      if (window.confirm(message)) {
        onRestoreDraft(draft.content);
        return;
      }

      await deleteDocumentDraft(draftId);
    };

    void restoreDraftIfNeeded();

    return () => {
      isCancelled = true;
    };
  }, [draftId, document.content, document.version, enabled, onRestoreDraft]);

  const persistLocalDraft = async (content: unknown[]) => {
    if (!enabled) {
      return;
    }

    const record: DocumentDraftRecord = {
      id: draftId,
      workspaceSlug,
      documentId: document.id,
      content,
      baseVersion: document.version,
      updatedAt: Date.now(),
      syncState: 'pending',
    };

    await saveDocumentDraft(record);
  };

  const markRemoteSaveStarted = async () => {
    if (!enabled) {
      return;
    }

    await markDocumentDraftSyncing(draftId);
  };

  const markRemoteSaveSucceeded = async () => {
    if (!enabled) {
      return;
    }

    await deleteDocumentDraft(draftId);
  };

  const markRemoteSaveFailed = async (error: unknown) => {
    if (!enabled) {
      return;
    }

    await markDocumentDraftFailed(draftId, getErrorMessage(error));
  };

  return {
    markRemoteSaveFailed,
    markRemoteSaveStarted,
    markRemoteSaveSucceeded,
    persistLocalDraft,
  };
}
