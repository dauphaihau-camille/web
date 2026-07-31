'use client';

import { useEffect } from 'react';

import type { BlockNoteClientEditor } from '../create-blocknote-editor-client.types';
import { handleExternalSubdocCreatedEvent } from '../external-subdoc-event';

export function useExternalSubdocCreated({
  documentId,
  editor,
  externalSubdocCreatedEventName,
  workspaceSlug,
}: {
  documentId?: string;
  editor: BlockNoteClientEditor;
  externalSubdocCreatedEventName?: string;
  workspaceSlug: string;
}) {
  useEffect(() => {
    if (!externalSubdocCreatedEventName || !documentId) {
      return;
    }

    const handleExternalSubdocCreated = (event: Event) => {
      handleExternalSubdocCreatedEvent({
        documentId,
        editor,
        event,
        workspaceSlug,
      });
    };

    window.addEventListener(
      externalSubdocCreatedEventName,
      handleExternalSubdocCreated,
    );

    return () => {
      window.removeEventListener(
        externalSubdocCreatedEventName,
        handleExternalSubdocCreated,
      );
    };
  }, [
    documentId,
    editor,
    externalSubdocCreatedEventName,
    workspaceSlug,
  ]);
}
