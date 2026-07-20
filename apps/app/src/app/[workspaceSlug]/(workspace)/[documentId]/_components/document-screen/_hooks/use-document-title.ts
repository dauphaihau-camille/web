'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

type UseDocumentTitleArgs = {
  document: Document;
  workspaceSlug: string;
  collaborationDocument: Yjs.Doc;
};

export function useDocumentTitle({
  document,
  workspaceSlug,
  collaborationDocument,
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

  useEffect(() => {
    const currentTitle = getNormalizedTitle(meta.get('title'), document.title);

    if (meta.get('title') !== currentTitle) {
      meta.set('title', currentTitle);
    }

    applyProjectedTitle({
      document,
      documentId,
      nextTitle: currentTitle,
      queryClient,
      workspaceSlug,
    });
    setSavedTitle(currentTitle);

    const handleMetaChange = () => {
      const nextTitle = getNormalizedTitle(meta.get('title'), document.title);

      if (meta.get('title') !== nextTitle) {
        meta.set('title', nextTitle);
      }

      applyProjectedTitle({
        document,
        documentId,
        nextTitle,
        queryClient,
        workspaceSlug,
      });
      setSavedTitle(nextTitle);
    };

    meta.observe(handleMetaChange);

    return () => {
      meta.unobserve(handleMetaChange);
      clearDraftTitle(documentId);
    };
  }, [clearDraftTitle, document, document.title, documentId, meta, queryClient, workspaceSlug]);

  const title = activeDraftDocumentId === documentId && activeDraftTitle !== null
    ? activeDraftTitle
    : savedTitle;

  const handleTitleChange = (nextTitle: string) => {
    setDocumentTitleDraft(documentId, nextTitle);
    meta.set('title', nextTitle);
  };

  const handleTitleBlur = (nextTitle: string) => {
    const normalizedTitle = getNormalizedTitle(nextTitle, document.title);

    clearDraftTitle(documentId);

    if (meta.get('title') !== normalizedTitle) {
      meta.set('title', normalizedTitle);
      return;
    }

    applyProjectedTitle({
      document,
      documentId,
      nextTitle: normalizedTitle,
      queryClient,
      workspaceSlug,
    });
    setSavedTitle(normalizedTitle);
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
