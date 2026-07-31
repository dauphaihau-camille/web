'use client';

import { useCallback } from 'react';
import type { Block } from '@blocknote/core';

import type { BlockNoteDocumentOperations } from '../../../blocknote-editor.types';
import { hasMeaningfulContent } from '../../../has-meaningful-content';
import { removeBlocksFromContent } from '../drag-handle-content';
import type { EditorBlock } from '../editor-block';

type UseDragHandleMenuActionsOptions = {
  blocksToActOn: EditorBlock[];
  currentBlock: EditorBlock | null;
  documentOperations?: BlockNoteDocumentOperations;
  editor: DragHandleEditor;
  isArchivingSubdocument: boolean;
  isDocumentBlock: boolean;
  sideMenu: {
    unfreezeMenu: () => void;
  };
  sourceWorkspaceId: string;
  subdocumentId: string | null;
};

type DragHandleEditor = {
  document: unknown;
  focus: () => void;
  getBlock: (blockId: string) => unknown;
  insertBlocks: (
    blocks: never[],
    referenceBlock: never,
    placement: 'after',
  ) => unknown;
  removeBlocks: (blocks: never[]) => unknown;
  transact: (callback: () => void) => void;
};

export function useDragHandleMenuActions({
  blocksToActOn,
  currentBlock,
  documentOperations,
  editor,
  isArchivingSubdocument,
  isDocumentBlock,
  sideMenu,
  sourceWorkspaceId,
  subdocumentId,
}: UseDragHandleMenuActionsOptions) {
  const canArchiveSubdocument = Boolean(
    !isArchivingSubdocument
    && subdocumentId
    && documentOperations?.onArchiveSubdocument,
  );
  const canDuplicateSubdocument = Boolean(
    isDocumentBlock
    && !documentOperations?.isDuplicating
    && subdocumentId,
  );

  const archiveSubdocument = useCallback((
    documentId: string,
    nextContent: Block[],
    blockIds: string[],
  ) => {
    if (!documentOperations?.onArchiveSubdocument) {
      return;
    }

    void documentOperations.onArchiveSubdocument(documentId, nextContent)
      .then(() => {
        if (!documentOperations.isCollaborative) {
          return;
        }

        const currentBlocks = blockIds
          .map((blockId) => editor.getBlock(blockId))
          .filter(Boolean) as Block[];

        if (currentBlocks.length > 0) {
          editor.transact(() => {
            editor.removeBlocks(currentBlocks as never[]);
          });
          editor.focus();
        }
      })
      .catch(() => {});
  }, [documentOperations, editor]);

  const duplicateSubdocument = useCallback((
    documentId: string,
    anchorBlockId: string,
  ) => {
    if (!documentOperations?.onDuplicate) {
      return;
    }

    sideMenu.unfreezeMenu();

    void Promise.resolve(documentOperations.onDuplicate(documentId))
      .then((duplicatedDocument) => {
        if (!documentOperations.isCollaborative || !duplicatedDocument) {
          return;
        }

        const anchorBlock = editor.getBlock(anchorBlockId);

        if (!anchorBlock) {
          return;
        }

        const duplicatedSubdocBlock = {
          type: 'subdoc' as const,
          props: {
            documentId: duplicatedDocument.id,
            publicId: duplicatedDocument.public_id,
            workspaceId: duplicatedDocument.workspace_id ??
              sourceWorkspaceId,
            publishedDocumentId: duplicatedDocument.published_document_id ?? '',
            title: duplicatedDocument.title || 'Untitled',
            hasContent: hasMeaningfulContent(duplicatedDocument.content),
          },
        };

        documentOperations.onDuplicateSubdocumentUndoMetadata?.({
          anchorBlockId,
          duplicatedSubdocumentId: duplicatedDocument.id,
          sourceSubdocumentId: documentId,
        });

        editor.transact(() => {
          editor.insertBlocks(
            [duplicatedSubdocBlock] as never[],
            anchorBlock as never,
            'after',
          );
        });
        editor.focus();
      })
      .catch(() => {});
  }, [documentOperations, editor, sideMenu, sourceWorkspaceId]);

  const archiveSelectedSubdocument = useCallback(() => {
    if (!canArchiveSubdocument || !subdocumentId) {
      return;
    }

    sideMenu.unfreezeMenu();

    const nextContent = removeBlocksFromContent(
      editor.document as Block[],
      new Set(blocksToActOn.map((block) => block.id)),
    );

    archiveSubdocument(
      subdocumentId,
      nextContent,
      blocksToActOn.map((block) => block.id),
    );
  }, [
    archiveSubdocument,
    blocksToActOn,
    canArchiveSubdocument,
    editor,
    sideMenu,
    subdocumentId,
  ]);

  const deleteSelectedBlocks = useCallback(() => {
    sideMenu.unfreezeMenu();
    editor.removeBlocks(blocksToActOn as never[]);
  }, [blocksToActOn, editor, sideMenu]);

  const duplicateSelectedSubdocument = useCallback(() => {
    if (!canDuplicateSubdocument || !currentBlock || !subdocumentId) {
      return;
    }

    duplicateSubdocument(subdocumentId, currentBlock.id);
  }, [
    canDuplicateSubdocument,
    currentBlock,
    duplicateSubdocument,
    subdocumentId,
  ]);

  return {
    archiveSelectedSubdocument,
    canArchiveSubdocument,
    canDuplicateSubdocument,
    deleteSelectedBlocks,
    duplicateSelectedSubdocument,
  };
}
