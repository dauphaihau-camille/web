'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDebounceFn } from 'ahooks';

import type { BlockNoteEditorProps } from '../../blocknote-editor.types';
import type { BlockNoteClientEditor } from '../create-blocknote-editor-client.types';

export function useEditorSaveController({
  collaboration,
  editor,
  isEditable,
  normalizedContent,
  onCollaborativeContentChangeAction,
  onContentChangeAction,
  onStartContentChangeAction,
  shouldSkipSaveWhileExecutingSlashCommand,
}: {
  collaboration: BlockNoteEditorProps['collaboration'];
  editor: BlockNoteClientEditor;
  isEditable: boolean;
  normalizedContent: unknown[];
  onCollaborativeContentChangeAction: BlockNoteEditorProps['onCollaborativeContentChangeAction'];
  onContentChangeAction: BlockNoteEditorProps['onContentChangeAction'];
  onStartContentChangeAction: BlockNoteEditorProps['onStartContentChangeAction'];
  shouldSkipSaveWhileExecutingSlashCommand: boolean;
}) {
  const [, setIsSaving] = useState(false);
  const [, setSaveError] = useState<string | null>(null);
  const lastSerializedContentRef = useRef(JSON.stringify(normalizedContent));
  const isSlashMenuOpenRef = useRef(false);
  const isSelectingSlashMenuItemRef = useRef(false);
  const isExecutingSlashCommandRef = useRef(false);
  const pendingSlashMenuSaveRef = useRef<unknown[] | null>(null);

  const { run: scheduleSave, cancel: cancelScheduledSave } = useDebounceFn(
    (nextContent: unknown[]) => {
      if (!onContentChangeAction) {
        return;
      }

      void onContentChangeAction(nextContent)
        .then(() => {
          setIsSaving(false);
        })
        .catch(() => {
          setIsSaving(false);
          setSaveError('Save failed');
        });
    },
    { wait: 500 },
  );

  useEffect(() => {
    if (collaboration) {
      return;
    }

    const nextSerializedContent = JSON.stringify(normalizedContent);

    if (nextSerializedContent === lastSerializedContentRef.current) {
      return;
    }

    // External content updates (for example command responses) supersede any
    // debounced local save that was queued against the previous version.
    cancelScheduledSave();
    setIsSaving(false);
    setSaveError(null);
    lastSerializedContentRef.current = nextSerializedContent;
    editor.replaceBlocks(editor.document, normalizedContent as never[]);
  }, [cancelScheduledSave, collaboration, normalizedContent, editor]);

  useEffect(() => {
    return () => {
      cancelScheduledSave();
    };
  }, [cancelScheduledSave]);

  const startSave = useCallback((nextContent: unknown[]) => {
    onStartContentChangeAction?.();
    setIsSaving(true);
    setSaveError(null);
    scheduleSave(nextContent);
  }, [onStartContentChangeAction, scheduleSave]);

  const flushPendingSlashMenuSave = useCallback(() => {
    if (
      isSelectingSlashMenuItemRef.current
      || (
        shouldSkipSaveWhileExecutingSlashCommand
        && isExecutingSlashCommandRef.current
      )
    ) {
      isSelectingSlashMenuItemRef.current = false;
      pendingSlashMenuSaveRef.current = null;
      return;
    }

    const pendingContent = pendingSlashMenuSaveRef.current;

    if (!pendingContent || !onContentChangeAction) {
      pendingSlashMenuSaveRef.current = null;
      return;
    }

    pendingSlashMenuSaveRef.current = null;
    startSave(pendingContent);
  }, [
    onContentChangeAction,
    shouldSkipSaveWhileExecutingSlashCommand,
    startSave,
  ]);

  const handleSlashMenuOpenChange = useCallback((open: boolean) => {
    isSlashMenuOpenRef.current = open;

    if (open) {
      pendingSlashMenuSaveRef.current = editor.document as unknown[];
      cancelScheduledSave();
      setIsSaving(false);
      return;
    }

    flushPendingSlashMenuSave();
  }, [cancelScheduledSave, editor, flushPendingSlashMenuSave]);

  const handleEditorChange = useCallback(() => {
    if (isEditable && collaboration) {
      onCollaborativeContentChangeAction?.();
      return;
    }

    if (!isEditable || collaboration || !onContentChangeAction) {
      return;
    }

    const nextContent = editor.document as unknown[];
    const serializedContent = JSON.stringify(nextContent);

    if (serializedContent === lastSerializedContentRef.current) {
      return;
    }

    lastSerializedContentRef.current = serializedContent;

    if (
      shouldSkipSaveWhileExecutingSlashCommand
      && isExecutingSlashCommandRef.current
    ) {
      pendingSlashMenuSaveRef.current = null;
      return;
    }

    if (isSlashMenuOpenRef.current) {
      pendingSlashMenuSaveRef.current = nextContent;
      return;
    }

    startSave(nextContent);
  }, [
    collaboration,
    editor,
    isEditable,
    onCollaborativeContentChangeAction,
    onContentChangeAction,
    shouldSkipSaveWhileExecutingSlashCommand,
    startSave,
  ]);

  return {
    cancelScheduledSave,
    handleEditorChange,
    handleSlashMenuOpenChange,
    isExecutingSlashCommandRef,
    isSelectingSlashMenuItemRef,
    lastSerializedContentRef,
    pendingSlashMenuSaveRef,
    setIsSaving,
  };
}
