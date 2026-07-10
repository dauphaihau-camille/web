'use client';

import {
  AddBlockButton,
  SideMenu,
  type SideMenuProps,
} from '@blocknote/react';

import type { BlockNoteDocumentOperations } from '../blocknote-editor.types';

import { EditorDragHandleButton } from './drag-handle-button';

type SideMenuComponentProps = SideMenuProps & {
  documentOperations?: BlockNoteDocumentOperations;
};

export function EditorSideMenu({
  documentOperations,
}: SideMenuComponentProps) {
  return (
    <SideMenu>
      <AddBlockButton />
      <EditorDragHandleButton documentOperations={documentOperations} />
    </SideMenu>
  );
}
