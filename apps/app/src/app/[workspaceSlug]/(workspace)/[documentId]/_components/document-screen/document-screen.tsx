'use client';

import { useCallback, useState } from 'react';
import { createBlockNoteEditorLoader } from '@shared/components/editor/create-blocknote-editor-loader';
import type { Document } from '@/domains/document';
import { Input } from '@shared/components/ui/input';

import { DocumentBreadcrumb } from './document-breadcrumb';
import { DocumentToolbar } from './document-toolbar/document-toolbar';
import { useDocumentToolbar } from './document-toolbar/use-document-toolbar';
import { ArchivedDocumentBar } from './archived-document-bar';
import { PublishedDocumentBar } from './published-document-bar';
import { useDocumentEditorActions } from './_hooks/use-document-editor-actions';
import { useDocumentTitle } from './_hooks/use-document-title';
import { useDocumentChromeVisibility } from './_hooks/use-document-chrome-visibility';
import { useDocumentCollaboration } from './_hooks/document-collaboration/use-document-collaboration';

const BlockNoteEditorLoader = createBlockNoteEditorLoader(
  () => import('./editor/blocknote-editor-client/blocknote-editor-client'),
);

export function DocumentScreen({
  document,
  workspaceSlug,
}: {
  document: Document;
  workspaceSlug: string;
}) {
  return (
    <DocumentScreenContent
      key={document.id}
      document={document}
      workspaceSlug={workspaceSlug}
    />
  );
}

function DocumentScreenContent({
  document,
  workspaceSlug,
}: {
  document: Document;
  workspaceSlug: string;
}) {
  const {
    hideChrome,
    isChromeVisible,
    revealChrome,
  } = useDocumentChromeVisibility();

  const documentId = document.id;
  const [editorContent, setEditorContent] = useState(document.content);

  const documentCollaboration = useDocumentCollaboration(documentId);
  const canEditDocument =
    documentCollaboration.isReady && documentCollaboration.canEdit;

  const handleRestoreDraft = useCallback((content: unknown[]) => {
    setEditorContent(content);
  }, []);

  const documentEditorActions = useDocumentEditorActions({
    collaborationEnabled: true,
    document,
    workspaceSlug,
    onRestoreDraft: handleRestoreDraft,
  });

  const documentToolbar = useDocumentToolbar({
    workspaceSlug,
    document,
  });

  const {
    displayTitle,
    handleTitleBlur,
    handleTitleChange,
    savedTitle,
    title,
  } = useDocumentTitle({
    collaborationDocument: documentCollaboration.document,
    document,
    workspaceSlug,
  });

  const isPublished = Boolean(
    documentToolbar.publishStatus?.published_document_id,
  );
  const isArchived = Boolean(document.archived_at);
  const statusBarHeight = 48;
  
  const publishedBarOffset = isArchived ? statusBarHeight : 0;
  const fixedHeaderOffset =
    (isPublished ? statusBarHeight : 0) +
    (isArchived ? statusBarHeight : 0);

  return (
    <section className="space-y-6" onPointerMove={revealChrome}>
      <PublishedDocumentBar
        publishedPath={documentToolbar.publishStatus?.public_path}
        offsetTop={publishedBarOffset}
      />
      {document.archived_at
        ? (
          <ArchivedDocumentBar
            archivedAt={document.archived_at}
            archivedByName={document.archived_by_name}
            isDeleting={documentToolbar.isPermanentlyDeleting}
            isRestoring={documentToolbar.isRestoring}
            offsetTop={0}
            onDelete={documentToolbar.permanentlyDeleteCurrentDocument}
            onRestore={documentToolbar.restoreCurrentDocument}
          />
        )
        : null}

      <div
        className="fixed inset-x-0 z-10 bg-background px-2 backdrop-blur md:left-(--sidebar-width)"
        style={{ top: fixedHeaderOffset }}
      >
        <div className="flex h-11 items-center justify-between gap-3">
          <DocumentBreadcrumb
            document={document}
            displayTitle={displayTitle}
            isVisible={isChromeVisible}
            workspaceSlug={workspaceSlug}
          />

          <DocumentToolbar
            canEdit={canEditDocument}
            isVisible={isChromeVisible}
            updatedAt={document.updated_at}
            {...documentToolbar}
          />
        </div>
      </div>

      <div
        className="mx-auto max-w-2xl"
        style={{ paddingTop: `${110 + fixedHeaderOffset}px` }}
      >
        <div className="space-y-3 px-[3.8rem]">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              value={title}
              onChange={(event) => {
                if (!canEditDocument) {
                  return;
                }

                hideChrome();
                handleTitleChange(event.target.value);
              }}
              onBlur={(event) => {
                if (!canEditDocument) {
                  return;
                }

                handleTitleBlur(event.currentTarget.value);
              }}
              readOnly={!canEditDocument}
              className="h-auto border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight shadow-none focus-visible:ring-0 dark:bg-transparent md:text-5xl"
            />
          </div>
        </div>

        {documentCollaboration.isReady
          ? (
            <BlockNoteEditorLoader
              key={documentId}
              collaboration={documentCollaboration.collaboration}
              documentId={documentId}
              documentTitle={savedTitle}
              workspaceSlug={workspaceSlug}
              content={editorContent}
              editable={canEditDocument}
              documentOperations={{
                isCollaborative: true,
                isArchiving: documentToolbar.isArchiving,
                archivingSubdocumentId: documentEditorActions.archivingSubdocumentId,
                isDuplicating: documentToolbar.isDuplicating,
                onArchive: documentToolbar.archiveCurrentDocument,
                onArchiveSubdocument: documentEditorActions.archiveSubdocument,
                onCopyLink: documentToolbar.copyLink,
                onDuplicate: documentToolbar.duplicateDocument,
              }}
              onCreateSubdocAction={
                canEditDocument ? documentEditorActions.createSubdocument : undefined
              }
            />
          )
          : (
            <div className="px-[3.8rem] py-4 text-sm text-muted-foreground">
              {documentCollaboration.error ?? 'Connecting editor...'}
            </div>
          )}
      </div>
    </section>
  );
}
