'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useDebounceFn } from 'ahooks';
import { useEffect, useState } from 'react';

import {
  documentKeys,
  type Document,
  updateDocument,
} from '@shared/domains/document';
import {
  updateCachedNavigationTitle,
  updateCachedReferencedSubdocTitles,
} from '@/domains/document/cache/document-query-cache';
import { workspaceRoutes } from '@shared/domains/workspace';
import { useDocumentTitleDraftStore } from '@/stores/document-title-draft-store';

import { useLatestWinsSaveQueue } from './use-latest-wins-save-queue';

type UseDocumentTitleArgs = {
  document: Document;
  workspaceSlug: string;
};

export function useDocumentTitle({
  document,
  workspaceSlug,
}: UseDocumentTitleArgs) {
  const queryClient = useQueryClient();
  const [savedTitle, setSavedTitle] = useState(document.title);
  const [draftTitle, setDraftTitle] = useState<string | null>(null);
  const activeDraftDocumentId = useDocumentTitleDraftStore((state) => state.activeDocumentId);
  const activeDraftTitle = useDocumentTitleDraftStore((state) => state.draftTitle);
  const clearDraftTitle = useDocumentTitleDraftStore((state) => state.clearDraftTitle);
  const setDocumentTitleDraft = useDocumentTitleDraftStore((state) => state.setDraftTitle);
  const documentId = document.id;

  const normalizeTitle = (value: string) => value.trim() || 'Untitled';

  const updateDocumentRoute = (nextTitle: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextPath = workspaceRoutes.document(
      workspaceSlug,
      document.public_id,
      nextTitle,
    );

    if (window.location.pathname !== nextPath) {
      const nextUrl = `${nextPath}${window.location.search}${window.location.hash}`;
      window.history.replaceState(null, '', nextUrl);
    }
  };

  const { run: scheduleRouteUpdate, cancel: cancelScheduledRouteUpdate } = useDebounceFn(
    updateDocumentRoute,
    { wait: 300 },
  );

  const finalizeTitleDraft = (nextTitle: string) => {
    setSavedTitle(nextTitle);
    setDraftTitle(null);
    setDocumentTitleDraft(documentId, nextTitle);
    clearDraftTitle(documentId);
  };

  const syncTitleCaches = (nextDocument: Document) => {
    queryClient.setQueryData<Document>(documentKeys.detail(documentId), nextDocument);
    updateCachedNavigationTitle(queryClient, workspaceSlug, documentId, nextDocument.title);
    updateDocumentRoute(nextDocument.title);
  };

  const persistReferencedSubdocTitles = async (nextTitle: string) => {
    const updatedReferencedDocuments = updateCachedReferencedSubdocTitles(
      queryClient,
      documentId,
      nextTitle,
    );

    await Promise.allSettled(
      updatedReferencedDocuments.map(async (referencingDocument) => {
        const savedReferencingDocument = await updateDocument(
          referencingDocument.documentId,
          {
            version: referencingDocument.version,
            content: referencingDocument.content,
          },
        );

        queryClient.setQueryData<Document>(
          documentKeys.detail(referencingDocument.documentId),
          savedReferencingDocument,
        );
      }),
    );
  };

  const queueTitleSave = useLatestWinsSaveQueue<string, { finalize: boolean }>({
    initialMeta: { finalize: false },
    onFlush: async (nextTitle, meta) => {
      const latestDocument =
        queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ?? document;

      if (nextTitle === latestDocument.title) {
        setSavedTitle(latestDocument.title);
        if (meta.finalize) {
          finalizeTitleDraft(latestDocument.title);
        }
        return;
      }

      const optimisticDocument = {
        ...latestDocument,
        title: nextTitle,
      };

      setSavedTitle(nextTitle);
      syncTitleCaches(optimisticDocument);

      const updatedDocument = await updateDocument(documentId, {
        version: latestDocument.version,
        title: nextTitle,
      });

      setSavedTitle(updatedDocument.title);
      syncTitleCaches(updatedDocument);
      await persistReferencedSubdocTitles(updatedDocument.title);

      if (meta.finalize) {
        finalizeTitleDraft(updatedDocument.title);
      }
    },
  });

  const {
    run: scheduleTitleSave,
    cancel: cancelScheduledTitleSave,
  } = useDebounceFn((nextTitle: string) => {
    void queueTitleSave(nextTitle);
  }, { wait: 600 });

  useEffect(() => () => {
    clearDraftTitle(documentId);
  }, [clearDraftTitle, documentId]);

  useEffect(() => () => {
    cancelScheduledRouteUpdate();
  }, [cancelScheduledRouteUpdate]);

  useEffect(() => () => {
    cancelScheduledTitleSave();
  }, [cancelScheduledTitleSave]);

  const title = draftTitle ?? savedTitle;
  const displayTitle =
    activeDraftDocumentId === documentId && activeDraftTitle !== null
      ? activeDraftTitle
      : title;

  const handleTitleChange = (nextTitle: string) => {
    setDraftTitle(nextTitle);
    setDocumentTitleDraft(documentId, nextTitle);
    scheduleRouteUpdate(normalizeTitle(nextTitle));
    scheduleTitleSave(nextTitle);
  };

  const handleTitleBlur = (nextTitle: string) => {
    cancelScheduledTitleSave();
    cancelScheduledRouteUpdate();
    updateDocumentRoute(normalizeTitle(nextTitle));
    void queueTitleSave(nextTitle, { finalize: true });
  };

  return {
    displayTitle,
    handleTitleBlur,
    handleTitleChange,
    savedTitle,
    title,
  };
}
