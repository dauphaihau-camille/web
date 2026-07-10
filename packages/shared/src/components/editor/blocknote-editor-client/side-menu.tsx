'use client';

import {
  AddBlockButton,
  SideMenu,
} from '@blocknote/react';

import { useDocumentOperations } from './document-operations-context';
import { EditorDragHandleButton } from './drag-handle-button';

export function EditorSideMenu() {
  const documentOperations = useDocumentOperations();

  return (
    <SideMenu>
      <AddBlockButton />
      <EditorDragHandleButton documentOperations={documentOperations} />
    </SideMenu>
  );
}
