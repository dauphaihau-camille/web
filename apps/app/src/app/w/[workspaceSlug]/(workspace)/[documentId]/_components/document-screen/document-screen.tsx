'use client';

import { createBlockNoteEditorLoader } from '@shared/components/editor/create-blocknote-editor-loader';
import type { Document } from '@/domains/document';
import { Textarea } from '@shared/components/ui/textarea';

import { DocumentBreadcrumb } from './document-breadcrumb';
import { DocumentToolbar } from './document-toolbar/document-toolbar';
import { useDocumentToolbar } from './document-toolbar/use-document-toolbar';
import { ArchivedDocumentBar } from './archived-document-bar';
import { PublishedDocumentBar } from './published-document-bar';
import { useDocumentTitle } from './_hooks/use-document-title';
import { DOCUMENT_LOCAL_EDIT_ORIGIN } from './_hooks/use-document-session-undo-redo';
import { useDocumentScreenState } from './_hooks/use-document-screen-state';
import { DocumentScreenBodySkeleton } from '../../../../_components/workspace-skeleton/document-screen-skeleton';

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
  const documentToolbar = useDocumentToolbar({
    workspaceSlug,
    document,
  });

  const {
    bodyEditorRef,
    canEditDocument,
    displayUpdatedAt,
    documentCollaboration,
    documentEditorActions,
    documentSessionUndoRedo,
    editorContent,
    handleDocumentContentInput,
    handleSessionUndoRedoBridgeChange,
    isChromeVisible,
    isSharePopoverOpen,
    markLocalEdit,
    revealChrome,
    setIsSharePopoverOpen,
    titleInputRef,
  } = useDocumentScreenState({
    document,
    workspaceSlug,
  });

  const documentId = document.id;

  const {
    displayTitle,
    handleTitleBlur,
    handleTitleChange,
    savedTitle,
    title,
  } = useDocumentTitle({
    collaborationDocument: documentCollaboration.document,
    document,
    editOrigin: DOCUMENT_LOCAL_EDIT_ORIGIN,
    workspaceSlug,
  });

  const isPublished = Boolean(
    documentToolbar.publishStatus?.published_document_id,
  );
  const isArchived = Boolean(document.archived_at);

  const statusBarHeight = 48;

  const showCollaborators =
    document.collaboration?.enabled === true
    && documentCollaboration.activeMemberCount >= 2;

  const publishedBarOffset = isArchived ? statusBarHeight : 0;

  const fixedHeaderOffset =
    (isPublished ? statusBarHeight : 0) +
    (isArchived ? statusBarHeight : 0);

  return (
    <section
      className="space-y-6"
      onPointerMove={() => {
        if (!isSharePopoverOpen) {
          revealChrome();
        }
      }}
    >
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
            canManageAccess={Boolean(document.access?.can_manage)}
            canEdit={canEditDocument}
            document={document}
            isVisible={isChromeVisible}
            showCollaborators={showCollaborators}
            updatedAt={displayUpdatedAt}
            workspaceSlug={workspaceSlug}
            onShareOpenChange={setIsSharePopoverOpen}
            {...documentToolbar}
          />
        </div>
      </div>

      <div
        className="mx-auto max-w-2xl"
        style={{ paddingTop: `${110 + fixedHeaderOffset}px` }}
      >
        {documentCollaboration.isReady
          ? (
            <>
              <div className="space-y-3 px-[3.8rem]">
                <div className="min-w-0 flex-1 space-y-2">
                  <Textarea
                    ref={titleInputRef}
                    value={title}
                    onChange={(event) => {
                      if (!canEditDocument) {
                        return;
                      }

                      markLocalEdit();
                      const nextTitle = event.currentTarget.value.replace(/\s*\r?\n\s*/g, ' ');

                      if (nextTitle !== event.currentTarget.value) {
                        event.currentTarget.value = nextTitle;
                      }

                      handleTitleChange(nextTitle);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') {
                        return;
                      }
                      event.preventDefault();
                      event.currentTarget.blur();
                    }}
                    onBlur={(event) => {
                      if (!canEditDocument) {
                        return;
                      }
                      handleTitleBlur(event.currentTarget.value);
                    }}
                    readOnly={!canEditDocument}
                    disabled={isArchived}
                    rows={1}
                    wrap="soft"
                    className="min-h-[1lh] resize-none overflow-hidden rounded-none border-0 bg-transparent px-0 py-0 text-4xl leading-tight font-semibold break-words whitespace-pre-wrap shadow-none disabled:cursor-default disabled:bg-transparent disabled:opacity-100 focus-visible:ring-0 md:text-5xl dark:bg-transparent dark:disabled:bg-transparent"
                  />
                </div>
              </div>

              <div ref={bodyEditorRef}>
                <BlockNoteEditorLoader
                  key={documentId}
                  collaboration={documentCollaboration.collaboration}
                  documentId={documentId}
                  documentTitle={savedTitle}
                  workspaceSlug={workspaceSlug}
                  content={editorContent}
                  editable={canEditDocument}
                  suppressHoverControls={isSharePopoverOpen}
                  onCollaborativeContentChangeAction={handleDocumentContentInput}
                  onSessionUndoRedoBridgeChangeAction={handleSessionUndoRedoBridgeChange}
                  documentOperations={{
                    isCollaborative: true,
                    isArchiving: documentToolbar.isArchiving,
                    archivingSubdocumentId: documentEditorActions.archivingSubdocumentId,
                    isDuplicating: documentToolbar.isDuplicating,
                    onArchive: documentToolbar.archiveCurrentDocument,
                    onArchiveSubdocument: documentEditorActions.archiveSubdocument,
                    onCopyLink: documentToolbar.copyLink,
                    onDuplicate: documentToolbar.duplicateDocument,
                    onDuplicateSubdocumentUndoMetadata: (metadata) => {
                      documentSessionUndoRedo.registerCommandUndoMetadata({
                        ...metadata,
                        type: 'duplicateSubdocument',
                      });
                    },
                  }}
                  onCreateSubdocAction={
                    canEditDocument ? documentEditorActions.createSubdocument : undefined
                  }
                />
              </div>
            </>
          )
          : documentCollaboration.error
            ? (
              <div className="px-[3.8rem] py-4 text-sm text-muted-foreground">
                {documentCollaboration.error}
              </div>
            )
            : <DocumentScreenBodySkeleton />}
      </div>
    </section>
  );
}
