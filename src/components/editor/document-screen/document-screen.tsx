'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  createDocument,
  documentKeys,
  setRecentWorkspaceDocumentId,
  type Document,
  updateDocument,
} from '@/domains/document';
import { useDocumentTitleDraftStore } from '@/stores/document-title-draft-store';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { type Workspace, workspaceRoutes } from '@/domains/workspace';

import { HeaderActions } from './header-actions/header-actions';
import { useDocumentChromeVisibility } from './use-document-chrome-visibility';

const BlockNoteEditor = dynamic(
  () => import('../blocknote-editor').then((module) => module.BlockNoteEditor),
  { ssr: false },
);

export function DocumentScreen({
  document,
  documentId,
  workspace,
  workspaceId,
}: {
  document: Document;
  documentId: string;
  workspace: Workspace;
  workspaceId: string;
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

  const updateDocumentMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateDocument>[1]) =>
      updateDocument(documentId, input),
    onSuccess: async (documentUpdated) => {
      queryClient.setQueryData(documentKeys.detail(documentId), documentUpdated);
      await queryClient.invalidateQueries({
        queryKey: documentKeys.tree(workspaceId),
      });
    },
  });

  const createSubpageMutation = useMutation({
    mutationFn: () =>
      createDocument({
        workspace_id: workspaceId,
        teamspace_id: document.teamspace_id,
        parent_document_id: document.id,
      }),
    onSuccess: async (childDocument) => {
      queryClient.setQueryData(documentKeys.detail(childDocument.id), childDocument);
      await queryClient.invalidateQueries({
        queryKey: documentKeys.tree(workspaceId),
      });
    },
  });

  useEffect(() => {
    setRecentWorkspaceDocumentId(workspaceId, documentId);
  }, [documentId, workspaceId]);

  useEffect(() => () => {
    clearDraftTitle(documentId);
  }, [clearDraftTitle, documentId]);

  const title = draftTitle ?? document.title;
  const displayTitle =
    activeDraftDocumentId === documentId && activeDraftTitle !== null
      ? activeDraftTitle
      : title;

  return (
    <section className="space-y-6" onPointerMove={revealChrome}>
      <div className="sticky top-0 z-10 -mx-5 bg-background/95 px-5 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-11 items-center justify-between gap-3">
          <Breadcrumb
            className={[
              'min-w-0 transition-opacity duration-200',
              isChromeVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
            ].join(' ')}
          >
            <BreadcrumbList className="min-w-0 flex-nowrap gap-1 text-sm">
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbLink
                  render={<Link href={workspaceRoutes.detail(workspaceId)} prefetch={false} />}
                  className="truncate rounded px-1.5 py-1 hover:bg-accent hover:text-foreground"
                >
                  {workspace?.name ?? 'Workspace'}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden text-muted-foreground/60 md:inline-flex" >
                /
              </BreadcrumbSeparator>
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate rounded px-1.5 py-1">
                  {displayTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <HeaderActions
            workspaceId={workspaceId}
            document={document}
            isVisible={isChromeVisible}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto pt-20">
        <div className="space-y-3  px-[3.3rem]">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              value={title}
              onChange={(event) => {
                hideChrome();
                const nextTitle = event.target.value;

                setDraftTitle(nextTitle);
                setDocumentTitleDraft(documentId, nextTitle);
              }}
              onBlur={() => {
                const nextTitle = title.trim() || 'Untitled';

                if (nextTitle === document.title) {
                  setDraftTitle(null);
                  clearDraftTitle(documentId);
                  return;
                }
                setDraftTitle(nextTitle);
                setDocumentTitleDraft(documentId, nextTitle);

                void updateDocumentMutation
                  .mutateAsync({
                    version: document.version,
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
  
        <BlockNoteEditor
          documentTitle={document.title}
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
          onCreateSubpage={() => createSubpageMutation.mutateAsync()}
        />
      </div>
    </section>
  );
}
