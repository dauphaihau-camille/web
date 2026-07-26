'use client';

import {
  useCallback,
  useRef,
  useState,
} from 'react';
import { createBlockNoteEditorLoader } from '@shared/components/editor/create-blocknote-editor-loader';
import type { Document } from '@/domains/document';
import { Textarea } from '@shared/components/ui/textarea';

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
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const [acknowledgedUpdatedAt, setAcknowledgedUpdatedAt] = useState<string | null>(null);
  const hasLocalEditRef = useRef(false);

  const collaborationMode = document.collaboration?.mode ??
    (document.access?.can_edit && !document.archived_at ? 'edit' : 'view');

  const showPresence = Boolean(document.collaboration?.show_presence);

  const displayUpdatedAt = getLatestTimestamp(
    document.updated_at,
    acknowledgedUpdatedAt,
  );

  const handleDocumentUpdatedAtChange = useCallback((updatedAt: string) => {
    if (!hasLocalEditRef.current) {
      return;
    }
    setAcknowledgedUpdatedAt(updatedAt);
  }, []);

  const documentCollaboration = useDocumentCollaboration(documentId, {
    onDocumentUpdatedAtChange: handleDocumentUpdatedAtChange,
    showPresence,
    workspaceId: document.workspace_id,
  });

  const canEditDocument =
    documentCollaboration.isReady
    && collaborationMode === 'edit'
    && documentCollaboration.canEdit;

  const handleRestoreDraft = useCallback((content: unknown[]) => {
    setEditorContent(content);
  }, []);

  const handleDocumentContentInput = useCallback(() => {
    if (!canEditDocument) {
      return;
    }
    hasLocalEditRef.current = true;
    hideChrome();
  }, [canEditDocument, hideChrome]);

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
        <div className="space-y-3 px-[3.8rem]">
          <div className="min-w-0 flex-1 space-y-2">
            <Textarea
              value={title}
              onChange={(event) => {
                if (!canEditDocument) {
                  return;
                }

                hasLocalEditRef.current = true;
                hideChrome();
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
              rows={1}
              wrap="soft"
              className="min-h-[1lh] resize-none overflow-hidden rounded-none border-0 bg-transparent px-0 py-0 text-4xl leading-tight font-semibold break-words whitespace-pre-wrap shadow-none focus-visible:ring-0 md:text-5xl dark:bg-transparent"
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
              suppressHoverControls={isSharePopoverOpen}
              onCollaborativeContentChangeAction={handleDocumentContentInput}
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

function getLatestTimestamp(firstTimestamp: string, secondTimestamp: string | null) {
  if (!secondTimestamp) {
    return firstTimestamp;
  }

  return new Date(secondTimestamp).getTime() > new Date(firstTimestamp).getTime()
    ? secondTimestamp
    : firstTimestamp;
}
