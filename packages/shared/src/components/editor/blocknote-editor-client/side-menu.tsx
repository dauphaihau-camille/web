'use client';

import {
  AddBlockButton,
  DragHandleButton,
  SideMenu,
  type SideMenuProps,
} from '@blocknote/react';

import type { BlockNoteDocumentOperations } from '../blocknote-editor.types';

import { DragHandleMenu } from './drag-handle-menu/drag-handle-menu';

type SideMenuComponentProps = SideMenuProps & {
  documentOperations?: BlockNoteDocumentOperations;
};

export function EditorSideMenu({
  documentOperations,
}: SideMenuComponentProps) {
  const dragHandleMenu = () => (
    <DragHandleMenu documentOperations={documentOperations} />
  );

  return (
    <SideMenu>
      <AddBlockButton />
      <DragHandleButton dragHandleMenu={dragHandleMenu} />
    </SideMenu>
  );
}
