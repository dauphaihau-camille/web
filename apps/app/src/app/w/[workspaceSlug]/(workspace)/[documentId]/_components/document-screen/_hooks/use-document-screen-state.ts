'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { BlockNoteSessionUndoRedoBridge } from '@shared/components/editor/blocknote-editor.types';

import type { Document } from '@/domains/document';

import { useDocumentChromeVisibility } from './use-document-chrome-visibility';
import { useDocumentCollaboration } from './document-collaboration/use-document-collaboration';
import { useDocumentEditorActions } from './use-document-editor-actions';
import {
  type CommandUndoMetadata,
  useDocumentSessionUndoRedo,
} from './use-document-session-undo-redo';

type UseDocumentScreenStateArgs = {
  document: Document;
  workspaceSlug: string;
};

export function useDocumentScreenState({
  document,
  workspaceSlug,
}: UseDocumentScreenStateArgs) {
  const {
    hideChrome,
    isChromeVisible,
    revealChrome,
  } = useDocumentChromeVisibility();

  const documentId = document.id;
  const [editorContent, setEditorContent] = useState(document.content);
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const [acknowledgedUpdatedAt, setAcknowledgedUpdatedAt] = useState<string | null>(null);
  const hasLocalEditRef = useRef(false);
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyEditorRef = useRef<HTMLDivElement | null>(null);
  const bodyUndoRedoBridgeRef = useRef<BlockNoteSessionUndoRedoBridge | null>(null);

  const commandUndoMetadataRegistrarRef =
    useRef<((metadata: CommandUndoMetadata) => void) | null>(null);

  const collaborationMode = document.collaboration?.mode ??
    (document.access?.can_edit && !document.archived_at ? 'edit' : 'view');

  const showPresence = Boolean(document.collaboration?.show_presence);

  const displayUpdatedAt = getLatestTimestamp(
    document.updated_at,
    acknowledgedUpdatedAt,
  );

  const markLocalEdit = useCallback(() => {
    hasLocalEditRef.current = true;
    hideChrome();
  }, [hideChrome]);

  const handleDocumentUpdatedAtChange = useCallback((updatedAt: string) => {
    if (!hasLocalEditRef.current) {
      return;
    }
    setAcknowledgedUpdatedAt(updatedAt);
  }, []);

  const documentCollaboration = useDocumentCollaboration(documentId, {
    onDocumentUpdatedAtChange: handleDocumentUpdatedAtChange,
    showPresence,
    workspaceId: document.workspace_id,
  });

  const canEditDocument =
    documentCollaboration.isReady
    && collaborationMode === 'edit'
    && documentCollaboration.canEdit;

  const handleRestoreDraft = useCallback((content: unknown[]) => {
    setEditorContent(content);
  }, []);

  const handleDocumentContentInput = useCallback(() => {
    if (!canEditDocument) {
      return;
    }
    markLocalEdit();
  }, [canEditDocument, markLocalEdit]);

  const handleSessionUndoRedoBridgeChange = useCallback((
    bridge: BlockNoteSessionUndoRedoBridge | null,
  ) => {
    bodyUndoRedoBridgeRef.current = bridge;
  }, []);

  const registerCommandUndoMetadata = useCallback((metadata: CommandUndoMetadata) => {
    commandUndoMetadataRegistrarRef.current?.(metadata);
  }, []);

  const documentEditorActions = useDocumentEditorActions({
    collaborationEnabled: true,
    document,
    registerCommandUndoMetadata,
    workspaceSlug,
    onRestoreDraft: handleRestoreDraft,
  });

  const documentSessionUndoRedo = useDocumentSessionUndoRedo({
    archiveRestoredSubdocument: documentEditorActions.archiveRestoredSubdocument,
    bodyUndoRedoBridgeRef,
    bodyEditorRef,
    document: documentCollaboration.document,
    enabled: canEditDocument && !document.archived_at,
    restoreArchivedSubdocument: documentEditorActions.restoreArchivedSubdocument,
    titleInputRef,
  });

  useEffect(() => {
    commandUndoMetadataRegistrarRef.current = documentSessionUndoRedo.registerCommandUndoMetadata;

    return () => {
      commandUndoMetadataRegistrarRef.current = null;
    };
  }, [documentSessionUndoRedo.registerCommandUndoMetadata]);

  return {
    bodyEditorRef,
    canEditDocument,
    displayUpdatedAt,
    documentCollaboration,
    documentEditorActions,
    documentSessionUndoRedo,
    editorContent,
    handleDocumentContentInput,
    handleSessionUndoRedoBridgeChange,
    isChromeVisible,
    isSharePopoverOpen,
    markLocalEdit,
    revealChrome,
    setIsSharePopoverOpen,
    titleInputRef,
  };
}

function getLatestTimestamp(firstTimestamp: string, secondTimestamp: string | null) {
  if (!secondTimestamp) {
    return firstTimestamp;
  }

  return new Date(secondTimestamp).getTime() > new Date(firstTimestamp).getTime()
    ? secondTimestamp
    : firstTimestamp;
}
