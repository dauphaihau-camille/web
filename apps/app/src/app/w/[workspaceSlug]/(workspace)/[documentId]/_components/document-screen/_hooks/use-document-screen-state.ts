'use client';

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import type {
  BlockNoteSessionUndoRedoBridge,
  CollaborativeContentChangeContext,
} from '@shared/components/editor/blocknote-editor.types';

import type { Document } from '@/domains/document';
import { useSubscriptionSummaryQuery } from '@/domains/subscription';
import { workspaceRoutes } from '@/domains/workspace';

import type { CollaborationBlockLimitError } from './use-document-collaboration/document-socket-provider';
import { useDocumentChromeVisibility } from './use-document-chrome-visibility';
import { useDocumentCollaboration } from './use-document-collaboration/use-document-collaboration';
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
  const lastBlockLimitToastAtRef = useRef(0);
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyEditorRef = useRef<HTMLDivElement | null>(null);
  const bodyUndoRedoBridgeRef = useRef<BlockNoteSessionUndoRedoBridge | null>(null);

  const commandUndoMetadataRegistrarRef =
    useRef<((metadata: CommandUndoMetadata) => void) | null>(null);

  const collaborationMode = document.collaboration?.mode ??
    (document.access?.can_edit && !document.archived_at ? 'edit' : 'view');

  const showPresence = Boolean(document.collaboration?.show_presence);

  const subscriptionQuery = useSubscriptionSummaryQuery(document.workspace_id);
  const subscription = subscriptionQuery.data;

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

  const handleBlockLimitReached = useCallback((_error: CollaborationBlockLimitError) => {
    if (!hasLocalEditRef.current) {
      return;
    }

    showBlockLimitToast({
      lastBlockLimitToastAtRef,
      workspaceSlug,
    });
  }, [workspaceSlug]);

  const documentCollaboration = useDocumentCollaboration(documentId, {
    onBlockLimitReached: handleBlockLimitReached,
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

  const handleDocumentContentInput = useCallback((
    _content: unknown[],
    context: CollaborativeContentChangeContext,
  ) => {
    if (!canEditDocument) {
      return false;
    }

    markLocalEdit();

    if (
      subscription?.block_limit !== null
      && subscription?.block_limit !== undefined
      && context.blockCountDelta > 0
      && subscription.block_count + context.blockCountDelta > subscription.block_limit
    ) {
      showBlockLimitToast({
        lastBlockLimitToastAtRef,
        workspaceSlug,
      });
      return false;
    }

    return true;
  }, [
    canEditDocument,
    markLocalEdit,
    subscription?.block_count,
    subscription?.block_limit,
    workspaceSlug,
  ]);

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

function showBlockLimitToast({
  lastBlockLimitToastAtRef,
  workspaceSlug,
}: {
  lastBlockLimitToastAtRef: RefObject<number>;
  workspaceSlug: string;
}) {
  const now = Date.now();

  if (now - lastBlockLimitToastAtRef.current < 1000) {
    return;
  }

  lastBlockLimitToastAtRef.current = now;

  toast('Block limit reached', {
    action: {
      label: 'Upgrade',
      onClick: () => {
        window.location.assign(workspaceRoutes.settingsBilling(workspaceSlug));
      },
    },
  });
}

function getLatestTimestamp(firstTimestamp: string, secondTimestamp: string | null) {
  if (!secondTimestamp) {
    return firstTimestamp;
  }

  return new Date(secondTimestamp).getTime() > new Date(firstTimestamp).getTime()
    ? secondTimestamp
    : firstTimestamp;
}
