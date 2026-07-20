'use client';

import { useCallback, useEffect } from 'react';
import type { Block } from '@blocknote/core';
import { SideMenuExtension } from '@blocknote/core/extensions';
import {
  BlockColorsItem,
  useBlockNoteEditor,
  useComponentsContext,
  useDictionary,
  useExtension,
  useExtensionState,
  useEditorState,
} from '@blocknote/react';
import { PaletteIcon } from 'lucide-react';

import type { BlockNoteDocumentOperations } from '../../blocknote-editor.types';
import { dragHandleMenuSelectionExtension } from '../drag-handle-menu-selection-extension';
import {
  getCurrentBlockLabel,
  type EditorBlock,
} from './editor-block';
import { MenuRow } from './menu-row';
import { NormalBlockMenu } from './normal-block-menu';
import { SubdocBlockMenu } from './subdoc-block-menu';

type DragHandleMenuProps = {
  documentOperations?: BlockNoteDocumentOperations;
};

export function DragHandleMenu({
  documentOperations,
}: DragHandleMenuProps) {
  const Components = useComponentsContext();
  const editor = useBlockNoteEditor();
  const dictionary = useDictionary();
  const sideMenu = useExtension(SideMenuExtension);

  const hoveredBlock = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });

  const selectedBlocks = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) =>
      currentEditor.getSelection()?.blocks ?? [currentEditor.getTextCursorPosition().block],
  });
  const canRenderMenu = Boolean(
    Components
    && documentOperations
    && hoveredBlock
    && selectedBlocks.length > 0,
  );

  const currentBlock = canRenderMenu ? hoveredBlock as EditorBlock : null;
  const currentBlockLabel = currentBlock
    ? getCurrentBlockLabel(currentBlock, dictionary)
    : '';
  const isDocumentBlock = currentBlock?.type === 'subdoc';

  const subdocumentId =
    currentBlock && typeof currentBlock.props.documentId === 'string'
      ? currentBlock.props.documentId
      : null;

  const isArchivingSubdocument = Boolean(
    isDocumentBlock
    && subdocumentId !== null
    && documentOperations?.archivingSubdocumentId === subdocumentId,
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
          .filter((block): block is Block => Boolean(block));

        if (currentBlocks.length > 0) {
          editor.removeBlocks(currentBlocks);
        }
      })
      .catch(() => {});
  }, [documentOperations, editor]);

  useEffect(() => {
    if (!canRenderMenu || !currentBlock) {
      return;
    }

    const effectBlocks = selectedBlocks.some((block) => block.id === currentBlock.id)
      ? selectedBlocks
      : [currentBlock];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      if (isDocumentBlock) {
        if (
          isArchivingSubdocument
          || !subdocumentId
          || !documentOperations?.onArchiveSubdocument
        ) {
          return;
        }

        sideMenu.unfreezeMenu();
        const nextContent = removeBlocksFromContent(
          editor.document as Block[],
          new Set(effectBlocks.map((block) => block.id)),
        );

        archiveSubdocument(
          subdocumentId,
          nextContent,
          effectBlocks.map((block) => block.id),
        );
        return;
      }

      sideMenu.unfreezeMenu();
      editor.removeBlocks(effectBlocks);
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    archiveSubdocument,
    canRenderMenu,
    currentBlock,
    documentOperations,
    editor,
    isArchivingSubdocument,
    isDocumentBlock,
    sideMenu,
    selectedBlocks,
    subdocumentId,
  ]);

  if (!canRenderMenu || !Components || !documentOperations || !currentBlock) {
    return null;
  }

  const blocksToActOn = selectedBlocks.some((block) => block.id === currentBlock.id)
    ? selectedBlocks
    : [currentBlock];

  const handleArchiveSubdocument = () => {
    if (
      isArchivingSubdocument
      || !subdocumentId
      || !documentOperations.onArchiveSubdocument
    ) {
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
  };

  const handleDelete = () => {
    sideMenu.unfreezeMenu();
    editor.removeBlocks(blocksToActOn);
  };

  return (
    <Components.Generic.Menu.Dropdown className="bn-menu-dropdown bn-drag-handle-menu drag-handle-menu">
      <ActiveBlockHighlight blockId={currentBlock.id} />
      <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
        {currentBlockLabel}
      </div>
      <BlockColorsItem>
        <MenuRow
          icon={<PaletteIcon className="size-4" />}
          label="Color"
        />
      </BlockColorsItem>
      {isDocumentBlock
        ? (
          <SubdocBlockMenu
            documentOperations={documentOperations}
            isArchivingSubdocument={isArchivingSubdocument}
            subdocumentId={subdocumentId}
            onArchive={handleArchiveSubdocument}
          />
        )
        : null}
      {isDocumentBlock
        ? null
        : (
          <NormalBlockMenu
            blocks={blocksToActOn as Block[]}
            onDelete={handleDelete}
          />
        )}
    </Components.Generic.Menu.Dropdown>
  );
}

function ActiveBlockHighlight({
  blockId,
}: {
  blockId: string;
}) {
  const dragHandleMenuSelection = useExtension(
    dragHandleMenuSelectionExtension,
  );

  useEffect(() => {
    dragHandleMenuSelection.setSelectedBlock(blockId);

    return () => {
      dragHandleMenuSelection.setSelectedBlock(null);
    };
  }, [blockId, dragHandleMenuSelection]);

  return null;
}

function removeBlocksFromContent(
  blocks: Block[],
  blockIdsToRemove: Set<string>,
): Block[] {
  return blocks.flatMap((block) => {
    if (blockIdsToRemove.has(block.id)) {
      return [];
    }

    const nextChildren = removeBlocksFromContent(
      (block.children ?? []) as Block[],
      blockIdsToRemove,
    );

    if (nextChildren === block.children) {
      return [block];
    }

    return [{
      ...block,
      children: nextChildren,
    } as Block];
  });
}
