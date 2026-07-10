'use client';

import type { Block, BlockNoteEditor } from '@blocknote/core';
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
import { toast } from 'sonner';

import type { BlockNoteDocumentOperations } from '../../blocknote-editor.types';
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

  if (!Components || !documentOperations || !hoveredBlock || selectedBlocks.length === 0) {
    return null;
  }

  const currentBlock = hoveredBlock as EditorBlock;
  const currentBlockLabel = getCurrentBlockLabel(currentBlock, dictionary);
  const isDocumentBlock = currentBlock.type === 'subpage';
  const subdocumentId =
    typeof currentBlock.props.documentId === 'string'
      ? currentBlock.props.documentId
      : null;
  const blocksToRemove = selectedBlocks.some((block) => block.id === hoveredBlock.id)
    ? selectedBlocks
    : [hoveredBlock];
  const isArchivingSubdocument =
    isDocumentBlock
    && subdocumentId !== null
    && documentOperations.archivingSubdocumentId === subdocumentId;
  const handleDelete = () => {
    sideMenu.unfreezeMenu();
    editor.removeBlocks(blocksToRemove);
  };
  const handleArchiveSubdocument = () => {
    if (
      isArchivingSubdocument
      || !subdocumentId
      || !documentOperations.onArchiveSubdocument
    ) {
      return;
    }

    const blockSnapshots = blocksToRemove.map((block) => cloneBlock(block as Block));
    const insertionPoint = findInsertionPoint(editor.document as Block[], blocksToRemove as Block[]);

    sideMenu.unfreezeMenu();
    editor.removeBlocks(blocksToRemove);

    void documentOperations.onArchiveSubdocument(subdocumentId).catch(() => {
      restoreBlocks(editor, blockSnapshots, insertionPoint);
      toast('Failed to move doc to trash');
    });
  };

  return (
    <Components.Generic.Menu.Dropdown className="bn-menu-dropdown bn-drag-handle-menu drag-handle-menu">
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
        : <NormalBlockMenu onDelete={handleDelete} />}
    </Components.Generic.Menu.Dropdown>
  );
}

function cloneBlock(block: Block): Block {
  return {
    ...block,
    props: { ...block.props },
    content: Array.isArray(block.content) ? JSON.parse(JSON.stringify(block.content)) : block.content,
    children: block.children.map((child) => cloneBlock(child as Block)),
  } as Block;
}

function flattenBlocks(blocks: Block[]): Block[] {
  return blocks.flatMap((block) => [
    block,
    ...flattenBlocks((block.children ?? []) as Block[]),
  ]);
}

function findInsertionPoint(documentBlocks: Block[], blocksToRemove: Block[]) {
  const flattenedBlocks = flattenBlocks(documentBlocks);
  const removedIds = new Set(blocksToRemove.map((block) => block.id));
  const firstRemovedIndex = flattenedBlocks.findIndex((block) => removedIds.has(block.id));
  const previousBlock =
    firstRemovedIndex <= 0
      ? null
      : [...flattenedBlocks.slice(0, firstRemovedIndex)]
        .reverse()
        .find((block) => !removedIds.has(block.id)) ?? null;
  const nextBlock =
    firstRemovedIndex === -1
      ? null
      : flattenedBlocks
        .slice(firstRemovedIndex + 1)
        .find((block) => !removedIds.has(block.id)) ?? null;

  return {
    nextBlock,
    previousBlock,
  };
}

function restoreBlocks(
  editor: BlockNoteEditor,
  blocks: Block[],
  insertionPoint: ReturnType<typeof findInsertionPoint>,
) {
  if (insertionPoint.previousBlock) {
    editor.insertBlocks(blocks as never[], insertionPoint.previousBlock, 'after');
    return;
  }

  if (insertionPoint.nextBlock) {
    editor.insertBlocks(blocks as never[], insertionPoint.nextBlock, 'before');
  }
}
