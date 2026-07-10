'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import type { BlockNoteDocumentOperations } from '../blocknote-editor.types';

const DocumentOperationsContext = createContext<
  BlockNoteDocumentOperations | undefined
>(undefined);

export function DocumentOperationsProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: BlockNoteDocumentOperations;
}) {
  return (
    <DocumentOperationsContext.Provider value={value}>
      {children}
    </DocumentOperationsContext.Provider>
  );
}

export function useDocumentOperations() {
  return useContext(DocumentOperationsContext);
}
