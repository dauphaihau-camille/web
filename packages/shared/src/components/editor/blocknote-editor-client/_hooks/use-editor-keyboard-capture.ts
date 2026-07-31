'use client';

import { useEffect } from 'react';

import type { BlockNoteClientEditor } from '../create-blocknote-editor-client.types';

export function useEditorKeyboardCapture(editor: BlockNoteClientEditor) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element) || !editor.isWithinEditor(target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editor]);
}
