'use client';

import { SideMenuExtension } from '@blocknote/core/extensions';
import {
  useBlockNoteEditor,
  useComponentsContext,
  useDictionary,
  useExtension,
  useExtensionState,
} from '@blocknote/react';
import { GripVerticalIcon } from 'lucide-react';

import type { BlockNoteDocumentOperations } from '../blocknote-editor.types';
import { DragHandleMenu } from './drag-handle-menu/drag-handle-menu';

type EditorDragHandleButtonProps = {
  documentOperations?: BlockNoteDocumentOperations;
};

export function EditorDragHandleButton({
  documentOperations,
}: EditorDragHandleButtonProps) {
  const Components = useComponentsContext();
  const dictionary = useDictionary();
  const editor = useBlockNoteEditor();
  const sideMenu = useExtension(SideMenuExtension);
  const hoveredBlock = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });

  if (!Components || !hoveredBlock) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      sideMenu.freezeMenu();
      return;
    }

    sideMenu.unfreezeMenu();
  };

  return (
    <Components.Generic.Menu.Root
      position="left"
      onOpenChange={handleOpenChange}
    >
      <Components.Generic.Menu.Trigger>
        <Components.SideMenu.Button
          className="bn-button"
          draggable={true}
          icon={<GripVerticalIcon className="size-5" data-test="dragHandle" />}
          label={dictionary.side_menu.drag_handle_label}
          onDragEnd={sideMenu.blockDragEnd}
          onDragStart={(event) => sideMenu.blockDragStart(event, hoveredBlock)}
        />
      </Components.Generic.Menu.Trigger>

      <DragHandleMenu documentOperations={documentOperations} />
    </Components.Generic.Menu.Root>
  );
}
