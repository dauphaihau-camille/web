'use client';

import { SideMenuController } from '@blocknote/react';

import type { BlockNoteDocumentOperations } from '../blocknote-editor.types';
import { DocumentOperationsProvider } from './document-operations-context';
import { EditorSideMenu } from './side-menu';

export function EditorSideMenuController({
  documentOperations,
}: {
  documentOperations?: BlockNoteDocumentOperations;
}) {
  return (
    <DocumentOperationsProvider value={documentOperations}>
      <SideMenuController sideMenu={EditorSideMenu} />
    </DocumentOperationsProvider>
  );
}
