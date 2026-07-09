'use client';

import type { Document } from '@shared/domains/document';
import { BlockNoteEditorLoader } from '@/components/editor/blocknote-editor-loader';
import { Input } from '@shared/components/ui/input';

import { DocumentBreadcrumb } from './document-breadcrumb';
import { HeaderActions } from './header-actions/header-actions';
import { useHeaderActions } from './header-actions/use-header-actions';
import { ArchivedDocumentBar } from './archived-document-bar';
import { PublishedDocumentBar } from './published-document-bar';
import { useDocumentScreenOperations } from './_hooks/use-document-screen-operations';
import { useDocumentTitle } from './_hooks/use-document-title';
import { useDocumentChromeVisibility } from './_hooks/use-document-chrome-visibility';

export function DocumentScreen({
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
  const documentOperations = useDocumentScreenOperations({
    document,
    workspaceSlug,
  });

  const headerActions = useHeaderActions({
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
    document,
    workspaceSlug,
  });

  const isPublished = Boolean(
    headerActions.publishStatus?.published_document_id,
  );
  const isArchived = Boolean(document.archived_at);
  const publishedBarOffset = isArchived ? 48 : 0;
  const fixedHeaderOffset =
    (isPublished ? 48 : 0) + (isArchived ? 48 : 0);

  return (
    <section className="space-y-6" onPointerMove={revealChrome}>
      <PublishedDocumentBar
        publishedPath={headerActions.publishStatus?.public_path}
        offsetTop={publishedBarOffset}
      />
      {document.archived_at
        ? (
          <ArchivedDocumentBar
            archivedAt={document.archived_at}
            archivedByName={document.archived_by_name}
            isDeleting={headerActions.isPermanentlyDeleting}
            isRestoring={headerActions.isRestoring}
            offsetTop={0}
            onDelete={headerActions.permanentlyDeleteCurrentDocument}
            onRestore={headerActions.restoreCurrentDocument}
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

          <HeaderActions
            isVisible={isChromeVisible}
            updatedAt={document.updated_at}
            {...headerActions}
          />
        </div>
      </div>

      <div
        className="mx-auto max-w-2xl"
        style={{ paddingTop: `${80 + fixedHeaderOffset}px` }}
      >
        <div className="space-y-3 px-[3.8rem]">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              value={title}
              onChange={(event) => {
                hideChrome();
                handleTitleChange(event.target.value);
              }}
              onBlur={(event) => handleTitleBlur(event.currentTarget.value)}
              className="h-auto border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight shadow-none focus-visible:ring-0 dark:bg-transparent md:text-5xl"
            />
          </div>
        </div>

        <BlockNoteEditorLoader
          key={documentId}
          documentId={documentId}
          documentTitle={savedTitle}
          workspaceSlug={workspaceSlug}
          content={document.content}
          documentOperations={{
            isArchiving: headerActions.isArchiving,
            archivingSubdocumentId: documentOperations.archivingSubdocumentId,
            isDuplicating: headerActions.isDuplicating,
            onArchive: headerActions.archiveCurrentDocument,
            onArchiveSubdocument: documentOperations.archiveSubdocument,
            onCopyLink: headerActions.copyLink,
            onDuplicate: headerActions.duplicateDocument,
          }}
          onStartContentChangeAction={hideChrome}
          onContentChangeAction={documentOperations.queueContentSave}
          onCreateSubdocAction={documentOperations.createSubdocument}
        />
      </div>
    </section>
  );
}
