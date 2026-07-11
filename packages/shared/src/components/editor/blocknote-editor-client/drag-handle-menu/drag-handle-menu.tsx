'use client';

import { useEffect } from 'react';
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

  const blocksToActOn = currentBlock
    ? (
      selectedBlocks.some((block) => block.id === currentBlock.id)
        ? selectedBlocks
        : [currentBlock]
    )
    : [];

  const isArchivingSubdocument = Boolean(
    isDocumentBlock
    && subdocumentId !== null
    && documentOperations?.archivingSubdocumentId === subdocumentId,
  );

  useEffect(() => {
    if (!canRenderMenu) {
      return;
    }

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
          new Set(blocksToActOn.map((block) => block.id)),
        );

        void documentOperations.onArchiveSubdocument(subdocumentId, nextContent).catch(() => {});
        return;
      }

      sideMenu.unfreezeMenu();
      editor.removeBlocks(blocksToActOn);
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    blocksToActOn,
    canRenderMenu,
    documentOperations,
    editor,
    isArchivingSubdocument,
    isDocumentBlock,
    sideMenu,
    subdocumentId,
  ]);

  if (!canRenderMenu || !Components || !documentOperations || !currentBlock) {
    return null;
  }

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

    void documentOperations.onArchiveSubdocument(subdocumentId, nextContent).catch(() => {});
  };

  const handleDelete = () => {
    sideMenu.unfreezeMenu();
    editor.removeBlocks(blocksToActOn);
  };

  return (
    <Components.Generic.Menu.Dropdown className="bn-menu-dropdown bn-drag-handle-menu drag-handle-menu">
      <ActiveBlockHighlight blockId={hoveredBlock.id} />
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
