'use client';

import {
  BlockColorsItem,
  useBlockNoteEditor,
  useComponentsContext,
  useDictionary,
  useEditorState,
} from '@blocknote/react';
import {
  CopyIcon,
  LinkIcon,
  PaletteIcon,
  Trash2Icon,
} from 'lucide-react';

import type { BlockNoteDocumentOperations } from '../../blocknote-editor.types';
import {
  getCurrentBlockLabel,
  type EditorBlock,
} from './editor-block';
import { MenuRow } from './menu-row';
import { TurnToItem } from './turn-to-item';

type DragHandleMenuProps = {
  documentOperations?: BlockNoteDocumentOperations;
};

export function DragHandleMenu({
  documentOperations,
}: DragHandleMenuProps) {
  const Components = useComponentsContext();
  const editor = useBlockNoteEditor();
  const dictionary = useDictionary();
  const selectedBlocks = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) =>
      currentEditor.getSelection()?.blocks ?? [currentEditor.getTextCursorPosition().block],
  });

  if (!Components || !documentOperations || selectedBlocks.length === 0) {
    return null;
  }

  const currentBlockLabel = getCurrentBlockLabel(selectedBlocks[0] as EditorBlock, dictionary);

  return (
    <Components.Generic.Menu.Dropdown className="bn-menu-dropdown bn-drag-handle-menu drag-handle-menu">
      <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
        {currentBlockLabel}
      </div>
      <TurnToItem />
      <BlockColorsItem>
        <MenuRow
          icon={<PaletteIcon className="size-4" />}
          label="Color"
        />
      </BlockColorsItem>
      <div className="mx-1 my-1 h-px bg-border" />
      <Components.Generic.Menu.Item
        className="bn-menu-item drag-handle-menu__item"
        onClick={() => {
          if (documentOperations.isDuplicating) {
            return;
          }

          documentOperations.onDuplicate();
        }}
      >
        <MenuRow
          icon={<CopyIcon className="size-4" />}
          label={documentOperations.isDuplicating ? 'Duplicating...' : 'Duplicate'}
          shortcut={'\u2318D'}
        />
      </Components.Generic.Menu.Item>
      <Components.Generic.Menu.Item
        className="bn-menu-item drag-handle-menu__item"
        onClick={() => {
          void documentOperations.onCopyLink();
        }}
      >
        <MenuRow
          icon={<LinkIcon className="size-4" />}
          label="Copy link"
          shortcut={'\u21e7\u2318L'}
        />
      </Components.Generic.Menu.Item>
      <Components.Generic.Menu.Item
        className="bn-menu-item drag-handle-menu__item drag-handle-menu__item--destructive"
        onClick={() => {
          if (documentOperations.isArchiving) {
            return;
          }

          documentOperations.onArchive();
        }}
      >
        <MenuRow
          icon={<Trash2Icon className="size-4" />}
          label={documentOperations.isArchiving ? 'Moving to Trash...' : 'Move to Trash'}
        />
      </Components.Generic.Menu.Item>
    </Components.Generic.Menu.Dropdown>
  );
}
