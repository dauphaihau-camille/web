"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import {
  archiveDocument,
  documentDetailQueryOptions,
  createDocument,
  documentKeys,
  setRecentWorkspaceDocumentId,
  type Document,
  updateDocument,
} from "@/domains/document";
import { BlockNoteEditorLoader } from "@/components/editor/blocknote-editor-loader";
import { hasMeaningfulContent } from "@/components/editor/has-meaningful-content";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { DocumentBreadcrumb } from "./document-breadcrumb";
import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
  removeCachedNavigationDocument,
  updateCachedNavigationContentStatus,
} from "./document-screen-cache";
import { HeaderActions } from "./header-actions/header-actions";
import { useHeaderActions } from "./header-actions/use-header-actions";
import { PublishedDocumentBar } from "./published-document-bar";
import { useDocumentTitle } from "./_hooks/use-document-title";
import { useDocumentChromeVisibility } from "./use-document-chrome-visibility";

export function DocumentScreen({
  document,
  workspaceSlug,
}: {
  document: Document;
  workspaceSlug: string;
}) {
  const queryClient = useQueryClient();
  const { hideChrome, isChromeVisible, revealChrome } =
    useDocumentChromeVisibility();
  const documentId = document.id;

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

  const updateContentMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateDocument>[1]) =>
      updateDocument(documentId, input),
    onSuccess: async (documentUpdated, variables) => {
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
          ...(variables.content !== undefined
            ? { content: variables.content }
            : {}),
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
      queryClient.setQueryData(
        documentKeys.detail(childDocument.id),
        childDocument,
      );
      markCachedNavigationNodeHasChildren(
        queryClient,
        workspaceSlug,
        documentId,
      );
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

  const archiveSubdocMutation = useMutation({
    mutationFn: async (subdocumentId: string) => {
      const subdocument = await queryClient.ensureQueryData(
        documentDetailQueryOptions(subdocumentId),
      );

      return archiveDocument(subdocumentId, subdocument.version);
    },
    onSuccess: async (archivedSubdocument) => {
      queryClient.setQueryData(
        documentKeys.detail(archivedSubdocument.id),
        archivedSubdocument,
      );
      removeCachedNavigationDocument(
        queryClient,
        workspaceSlug,
        archivedSubdocument.id,
      );
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
      toast("Moved to trash");
    },
  });

  useEffect(() => {
    setRecentWorkspaceDocumentId(workspaceSlug, documentId);
  }, [documentId, workspaceSlug]);

  return (
    <section className="space-y-6" onPointerMove={revealChrome}>
      <PublishedDocumentBar
        publishedPath={headerActions.publishStatus?.public_path}
      />

      <div
        className={cn(
          "fixed inset-x-0 z-10 bg-background px-2 backdrop-blur md:left-(--sidebar-width)",
          isPublished ? "top-12" : "top-0",
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
            isVisible={isChromeVisible}
            updatedAt={document.updated_at}
            {...headerActions}
          />
        </div>
      </div>

      <div className={cn("mx-auto max-w-2xl", isPublished ? "pt-32" : "pt-20")}>
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
            archivingSubdocumentId: archiveSubdocMutation.variables ?? null,
            isDuplicating: headerActions.isDuplicating,
            onArchive: headerActions.archiveCurrentDocument,
            onArchiveSubdocument: async (subdocumentId) => {
              await archiveSubdocMutation.mutateAsync(subdocumentId);
            },
            onCopyLink: headerActions.copyLink,
            onDuplicate: headerActions.duplicateDocument,
          }}
          onStartContentChangeAction={hideChrome}
          onContentChangeAction={async (content) => {
            const latest =
              queryClient.getQueryData<typeof document>(
                documentKeys.detail(documentId),
              ) ?? document;

            const updated = await updateContentMutation.mutateAsync({
              version: latest.version,
              content,
            });

            queryClient.setQueryData(documentKeys.detail(documentId), updated);
          }}
          onCreateSubdocAction={() => createSubDocMutation.mutateAsync()}
        />
      </div>
    </section>
  );
}
