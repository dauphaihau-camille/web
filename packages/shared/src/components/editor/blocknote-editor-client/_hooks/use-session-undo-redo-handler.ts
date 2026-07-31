'use client';

import { useEffect } from 'react';

import type { BlockNoteEditorProps } from '../../blocknote-editor.types';
import type { BlockNoteClientEditor } from '../create-blocknote-editor-client.types';

export function useSessionUndoRedoHandler({
  editor,
  onSessionUndoRedoBridgeChangeAction,
}: {
  editor: BlockNoteClientEditor;
  onSessionUndoRedoBridgeChangeAction: BlockNoteEditorProps['onSessionUndoRedoBridgeChangeAction'];
}) {
  useEffect(() => {
    if (!onSessionUndoRedoBridgeChangeAction) {
      return;
    }

    const restoreBodySelection = (preferredBlockId?: string) => {
      const targetBlock = getSessionUndoRedoTargetBlock(editor, preferredBlockId);

      if (!targetBlock) {
        return;
      }

      window.requestAnimationFrame(() => {
        if (!editor.getBlock(targetBlock.id)) {
          return;
        }

        editor.setTextCursorPosition(targetBlock.id, 'start');
        editor.focus();
      });
    };

    onSessionUndoRedoBridgeChangeAction({
      redo: (context) => {
        const applied = editor.redo();

        if (applied) {
          restoreBodySelection(context?.preferredBlockId);
        }

        return applied;
      },
      undo: (context) => {
        const applied = editor.undo();

        if (applied) {
          restoreBodySelection(context?.preferredBlockId);
        }

        return applied;
      },
    });

    return () => {
      onSessionUndoRedoBridgeChangeAction(null);
    };
  }, [
    editor,
    onSessionUndoRedoBridgeChangeAction,
  ]);
}


// ---------- Private helpers ----------

function getSessionUndoRedoTargetBlock(
  editor: BlockNoteClientEditor,
  preferredBlockId?: string,
) {
  const preferredBlock = preferredBlockId
    ? editor.getBlock(preferredBlockId)
    : undefined;
  const textCursorBlock = getTextCursorBlock(editor);

  return (
    preferredBlock && canPlaceTextCursor(preferredBlock)
      ? preferredBlock
      : textCursorBlock && canPlaceTextCursor(textCursorBlock)
        ? textCursorBlock
        : (editor.document as unknown[]).find((block) => canPlaceTextCursor(block))
  );
}

function getTextCursorBlock(editor: BlockNoteClientEditor) {
  try {
    return editor.getTextCursorPosition().block;
  }
  catch {
    return undefined;
  }
}

function canPlaceTextCursor(block: unknown) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    return false;
  }

  const candidate = block as { content?: unknown; type?: unknown };

  return candidate.type === 'paragraph' || Array.isArray(candidate.content);
}
