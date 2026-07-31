'use client';

import type { Block } from '@blocknote/core';
import { BlockColorsItem } from '@blocknote/react';
import { PaletteIcon } from 'lucide-react';

import type { BlockNoteDocumentOperations } from '../../blocknote-editor.types';
import { ActiveBlockHighlight } from './active-block-highlight';
import { useDragHandleKeybindings } from './_hooks/use-drag-handle-keybindings';
import { useDragHandleMenuActions } from './_hooks/use-drag-handle-menu-actions';
import { useDragHandleMenuState } from './_hooks/use-drag-handle-menu-state';
import { MenuRow } from './menu-row';
import { NormalBlockMenu } from './normal-block-menu';
import { SubdocBlockMenu } from './subdoc-block-menu';

type DragHandleMenuProps = {
  documentOperations?: BlockNoteDocumentOperations;
};

export function DragHandleMenu({
  documentOperations,
}: DragHandleMenuProps) {
  const {
    Components,
    blocksToActOn,
    canRenderMenu,
    currentBlock,
    currentBlockLabel,
    editor,
    isArchivingSubdocument,
    isDocumentBlock,
    sideMenu,
    sourceWorkspaceId,
    subdocumentId,
  } = useDragHandleMenuState(documentOperations);

  const {
    archiveSelectedSubdocument,
    canDuplicateSubdocument,
    deleteSelectedBlocks,
    duplicateSelectedSubdocument,
  } = useDragHandleMenuActions({
    blocksToActOn,
    currentBlock,
    documentOperations,
    editor,
    isArchivingSubdocument,
    isDocumentBlock: Boolean(isDocumentBlock),
    sideMenu,
    sourceWorkspaceId,
    subdocumentId,
  });

  useDragHandleKeybindings({
    canDuplicateSubdocument,
    canRenderMenu,
    duplicateSelectedSubdocument,
    isDocumentBlock: Boolean(isDocumentBlock),
    onArchiveSubdocument: archiveSelectedSubdocument,
    onDeleteBlocks: deleteSelectedBlocks,
  });

  if (!canRenderMenu || !Components || !documentOperations || !currentBlock) {
    return null;
  }

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
            onArchive={archiveSelectedSubdocument}
            onDuplicate={duplicateSelectedSubdocument}
          />
        )
        : null}
      {isDocumentBlock
        ? null
        : (
          <NormalBlockMenu
            blocks={blocksToActOn as Block[]}
            onDelete={deleteSelectedBlocks}
          />
        )}
    </Components.Generic.Menu.Dropdown>
  );
}
