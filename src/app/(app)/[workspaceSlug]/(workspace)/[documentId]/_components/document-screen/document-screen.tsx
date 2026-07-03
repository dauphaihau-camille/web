'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounceFn } from 'ahooks';
import { useEffect, useState } from 'react';

import {
  createDocument,
  documentKeys,
  setRecentWorkspaceDocumentId,
  type Document,
  updateDocument,
} from '@/domains/document';
import { EditableBlockNoteEditor } from '@/components/editor/editable-blocknote-editor';
import { hasMeaningfulContent } from '@/components/editor/has-meaningful-content';
import { workspaceRoutes } from '@/domains/workspace';
import { usePublishStatusQuery } from '@/domains/publish';
import { useDocumentTitleDraftStore } from '@/stores/document-title-draft-store';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { DocumentBreadcrumb } from './document-breadcrumb';
import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
  updateCachedNavigationContentStatus,
  updateCachedNavigationTitle,
  updateCachedReferencedSubdocTitles,
} from './document-screen-cache';
import { HeaderActions } from './header-actions/header-actions';
import { PublishedDocumentBar } from './published-document-bar';
import { useDocumentChromeVisibility } from './use-document-chrome-visibility';

export function DocumentScreen({
  document,
  workspaceSlug,
}: {
  document: Document;
  workspaceSlug: string;
}) {
  const queryClient = useQueryClient();
  const [draftTitle, setDraftTitle] = useState<string | null>(null);
  const activeDraftDocumentId = useDocumentTitleDraftStore((state) => state.activeDocumentId);
  const activeDraftTitle = useDocumentTitleDraftStore((state) => state.draftTitle);
  const clearDraftTitle = useDocumentTitleDraftStore((state) => state.clearDraftTitle);
  const setDocumentTitleDraft = useDocumentTitleDraftStore((state) => state.setDraftTitle);
  const {
    hideChrome,
    isChromeVisible,
    revealChrome,
  } = useDocumentChromeVisibility();
  const documentId = document.id;
  const publishStatusQuery = usePublishStatusQuery(documentId);
  const isPublished = Boolean(publishStatusQuery.data?.published_document_id);

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

  const updateDocumentMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateDocument>[1]) =>
      updateDocument(documentId, input),
    onSuccess: async (documentUpdated, variables) => {
      if (variables.title !== undefined) {
        updateCachedNavigationTitle(queryClient, workspaceSlug, documentId, variables.title);
        updateCachedReferencedSubdocTitles(queryClient, documentId, variables.title);
      }
      if (variables.content !== undefined) {
        updateCachedNavigationContentStatus(
          queryClient,
          workspaceSlug,
          documentId,
          hasMeaningfulContent(documentUpdated.content),
        );
      }
      queryClient.setQueryData<Document>(
        documentKeys.detail(documentId),
        (currentDocument) => ({
          ...(currentDocument ?? documentUpdated),
          ...documentUpdated,
          ...(variables.title !== undefined ? { title: variables.title } : {}),
          ...(variables.content !== undefined ? { content: variables.content } : {}),
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: documentKeys.tree(workspaceSlug),
      });
    },
  });

  const createSubDocMutation = useMutation({
    mutationFn: () =>
      createDocument({
        workspace_id: workspaceSlug,
        teamspace_id: document.teamspace_id,
        parent_document_id: document.id,
      }),
    onSuccess: async (childDocument) => {
      queryClient.setQueryData(documentKeys.detail(childDocument.id), childDocument);
      markCachedNavigationNodeHasChildren(queryClient, workspaceSlug, documentId);
      insertCreatedSubdocIntoCachedChildren(
        queryClient,
        workspaceSlug,
        document.id,
        childDocument,
      );
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
    },
  });

  useEffect(() => {
    setRecentWorkspaceDocumentId(workspaceSlug, documentId);
  }, [documentId, workspaceSlug]);

  useEffect(() => () => {
    clearDraftTitle(documentId);
  }, [clearDraftTitle, documentId]);

  useEffect(() => () => {
    cancelScheduledRouteUpdate();
  }, [cancelScheduledRouteUpdate]);

  const title = draftTitle ?? document.title;
  const displayTitle =
    activeDraftDocumentId === documentId && activeDraftTitle !== null
      ? activeDraftTitle
      : title;

  return (
    <section className="space-y-6" onPointerMove={revealChrome}>
      <PublishedDocumentBar publishedPath={publishStatusQuery.data?.public_path} />

      <div
        className={cn(
          'fixed inset-x-0 z-10 bg-background px-2 backdrop-blur md:left-(--sidebar-width)',
          isPublished ? 'top-12' : 'top-0',
        )}
      >
        <div className="flex h-11 items-center justify-between gap-3">
          <DocumentBreadcrumb
            document={document}
            displayTitle={displayTitle}
            isVisible={isChromeVisible}
            workspaceSlug={workspaceSlug}
          />

          <HeaderActions
            workspaceSlug={workspaceSlug}
            document={document}
            isVisible={isChromeVisible}
          />
        </div>
      </div>

      <div className={cn('mx-auto max-w-2xl', isPublished ? 'pt-32' : 'pt-20')}>
        <div className="space-y-3 px-[3.8rem]">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              value={title}
              onChange={(event) => {
                hideChrome();
                const nextTitle = event.target.value;

                setDraftTitle(nextTitle);
                setDocumentTitleDraft(documentId, nextTitle);
                scheduleRouteUpdate(nextTitle.trim() || 'Untitled');
              }}
              onBlur={(event) => {
                const latestDocument =
                  queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ?? document;
                const nextTitle = event.currentTarget.value.trim() || 'Untitled';

                if (nextTitle === latestDocument.title) {
                  setDraftTitle(null);
                  clearDraftTitle(documentId);
                  return;
                }
                setDraftTitle(nextTitle);
                setDocumentTitleDraft(documentId, nextTitle);
                cancelScheduledRouteUpdate();
                updateDocumentRoute(nextTitle);

                queryClient.setQueryData<Document>(
                  documentKeys.detail(documentId),
                  {
                    ...latestDocument,
                    title: nextTitle,
                  },
                );
                updateCachedNavigationTitle(queryClient, workspaceSlug, documentId, nextTitle);

                void updateDocumentMutation
                  .mutateAsync({
                    version: latestDocument.version,
                    title: nextTitle,
                  })
                  .then(() => {
                    setDraftTitle(null);
                    clearDraftTitle(documentId);
                  });
              }}
              className="h-auto border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight shadow-none focus-visible:ring-0 dark:bg-transparent md:text-5xl"
            />
          </div>
        </div>
  
        <EditableBlockNoteEditor
          key={documentId}
          documentId={documentId}
          documentTitle={document.title}
          workspaceSlug={workspaceSlug}
          content={document.content}
          onStartContentChange={hideChrome}
          onContentChange={async (content) => {
            const latest =
              queryClient.getQueryData<typeof document>(
                documentKeys.detail(documentId),
              ) ?? document;

            const updated = await updateDocumentMutation.mutateAsync({
              version: latest.version,
              content,
            });
  
            queryClient.setQueryData(documentKeys.detail(documentId), updated);
          }}
          onCreateSubdoc={() => createSubDocMutation.mutateAsync()}
        />
      </div>
    </section>
  );
}
