'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useDebounceFn } from 'ahooks';
import type * as Yjs from 'yjs';

import {
  documentKeys,
  type Document,
} from '@/domains/document';
import {
  updateCachedNavigationTitle,
  updateCachedReferencedSubdocTitles,
} from '@/domains/document/cache/document-query-cache';
import { workspaceRoutes } from '@/domains/workspace';
import { useDocumentTitleDraftStore } from '@/stores/document-title-draft-store';

import { DOCUMENT_SYSTEM_SYNC_ORIGIN } from './use-document-session-undo-redo';

type UseDocumentTitleArgs = {
  document: Document;
  workspaceSlug: string;
  collaborationDocument: Yjs.Doc;
  editOrigin?: unknown;
};

const TITLE_PROJECTION_DEBOUNCE_MS = 300;

export function useDocumentTitle({
  document,
  workspaceSlug,
  collaborationDocument,
  editOrigin,
}: UseDocumentTitleArgs) {
  const queryClient = useQueryClient();
  const activeDraftDocumentId = useDocumentTitleDraftStore((state) => state.activeDocumentId);
  const activeDraftTitle = useDocumentTitleDraftStore((state) => state.draftTitle);
  const clearDraftTitle = useDocumentTitleDraftStore((state) => state.clearDraftTitle);
  const setDocumentTitleDraft = useDocumentTitleDraftStore((state) => state.setDraftTitle);
  const documentId = document.id;
  const meta = collaborationDocument.getMap('meta');

  const [savedTitle, setSavedTitle] = useState(() => getNormalizedTitle(
    meta.get('title'),
    document.title,
  ));

  const projectTitle = useCallback((nextTitle: string) => {
    applyProjectedTitle({
      document,
      documentId,
      nextTitle,
      queryClient,
      workspaceSlug,
    });
    setSavedTitle(nextTitle);
  }, [document, documentId, queryClient, workspaceSlug]);

  const {
    run: scheduleTitleProjection,
    cancel: cancelScheduledTitleProjection,
    flush: flushScheduledTitleProjection,
  } = useDebounceFn(projectTitle, {
    wait: TITLE_PROJECTION_DEBOUNCE_MS,
  });

  const commitTitle = useCallback((nextTitle: string) => {
    const normalizedTitle = getNormalizedTitle(nextTitle, document.title);

    if (meta.get('title') !== normalizedTitle) {
      collaborationDocument.transact(() => {
        meta.set('title', normalizedTitle);
      }, editOrigin);
      return;
    }

    projectTitle(normalizedTitle);
  }, [
    collaborationDocument,
    document.title,
    editOrigin,
    meta,
    projectTitle,
  ]);

  useEffect(() => {
    const currentTitle = getNormalizedTitle(meta.get('title'), document.title);

    if (meta.get('title') !== currentTitle) {
      collaborationDocument.transact(() => {
        meta.set('title', currentTitle);
      }, DOCUMENT_SYSTEM_SYNC_ORIGIN);
    }

    projectTitle(currentTitle);

    const handleMetaChange = (_event: unknown, transaction: { origin: unknown }) => {
      const nextTitle = getNormalizedTitle(meta.get('title'), document.title);

      if (meta.get('title') !== nextTitle) {
        collaborationDocument.transact(() => {
          meta.set('title', nextTitle);
        }, DOCUMENT_SYSTEM_SYNC_ORIGIN);
      }

      if (transaction.origin === editOrigin) {
        scheduleTitleProjection(nextTitle);
        return;
      }

      cancelScheduledTitleProjection();
      clearDraftTitle(documentId);
      projectTitle(nextTitle);
    };

    meta.observe(handleMetaChange);

    return () => {
      cancelScheduledTitleProjection();
      meta.unobserve(handleMetaChange);
    };
  }, [
    cancelScheduledTitleProjection,
    clearDraftTitle,
    collaborationDocument,
    document,
    document.title,
    documentId,
    editOrigin,
    meta,
    projectTitle,
    scheduleTitleProjection,
  ]);

  useEffect(() => () => {
    clearDraftTitle(documentId);
  }, [clearDraftTitle, documentId]);

  const title = activeDraftDocumentId === documentId && activeDraftTitle !== null
    ? activeDraftTitle
    : savedTitle;

  const handleTitleChange = (nextTitle: string) => {
    setDocumentTitleDraft(documentId, nextTitle);
    commitTitle(nextTitle);
  };

  const handleTitleBlur = (nextTitle: string) => {
    cancelScheduledTitleProjection();
    clearDraftTitle(documentId);
    commitTitle(nextTitle);
    flushScheduledTitleProjection();
  };

  return {
    displayTitle: title,
    handleTitleBlur,
    handleTitleChange,
    savedTitle,
    title,
  };
}

function getNormalizedTitle(value: unknown, fallbackTitle: string) {
  if (typeof value !== 'string') {
    return normalizeTitle(fallbackTitle);
  }

  return normalizeTitle(value);
}

function normalizeTitle(value: string) {
  const normalized = value.trim();

  return normalized || 'Untitled';
}

function updateDocumentRoute(
  workspaceSlug: string,
  publicId: string,
  nextTitle: string,
) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextPath = workspaceRoutes.document(
    workspaceSlug,
    publicId,
    nextTitle,
  );

  if (window.location.pathname !== nextPath) {
    const nextUrl = `${nextPath}${window.location.search}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }
}

function applyProjectedTitle({
  document,
  documentId,
  nextTitle,
  queryClient,
  workspaceSlug,
}: {
  document: Document;
  documentId: string;
  nextTitle: string;
  queryClient: ReturnType<typeof useQueryClient>;
  workspaceSlug: string;
}) {
  const cachedDocument =
    queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ??
    queryClient.getQueryData<Document>(documentKeys.detail(document.public_id)) ??
    document;

  const projectedDocument = {
    ...cachedDocument,
    title: nextTitle,
  };

  queryClient.setQueryData<Document>(documentKeys.detail(documentId), projectedDocument);
  queryClient.setQueryData<Document>(
    documentKeys.detail(projectedDocument.public_id),
    projectedDocument,
  );
  updateCachedNavigationTitle(queryClient, workspaceSlug, documentId, nextTitle);
  updateCachedReferencedSubdocTitles(queryClient, documentId, nextTitle);
  updateDocumentRoute(workspaceSlug, document.public_id, nextTitle);
}
