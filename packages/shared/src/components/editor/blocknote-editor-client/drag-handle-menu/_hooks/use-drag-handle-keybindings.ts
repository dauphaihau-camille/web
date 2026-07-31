'use client';

import { useEffect } from 'react';

type UseDragHandleKeybindingsOptions = {
  canDuplicateSubdocument: boolean;
  canRenderMenu: boolean;
  duplicateSelectedSubdocument: () => void;
  isDocumentBlock: boolean;
  onArchiveSubdocument: () => void;
  onDeleteBlocks: () => void;
};

export function useDragHandleKeybindings({
  canDuplicateSubdocument,
  canRenderMenu,
  duplicateSelectedSubdocument,
  isDocumentBlock,
  onArchiveSubdocument,
  onDeleteBlocks,
}: UseDragHandleKeybindingsOptions) {

  useEffect(() => {
    if (!canRenderMenu) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDuplicateShortcut(event)) {
        if (!canDuplicateSubdocument) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        duplicateSelectedSubdocument();
        return;
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (isDocumentBlock) {
        onArchiveSubdocument();
        return;
      }

      onDeleteBlocks();
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    canDuplicateSubdocument,
    canRenderMenu,
    duplicateSelectedSubdocument,
    isDocumentBlock,
    onArchiveSubdocument,
    onDeleteBlocks,
  ]);
}

function isDuplicateShortcut(event: KeyboardEvent) {
  return (
    (event.metaKey || event.ctrlKey)
    && !event.altKey
    && event.key.toLowerCase() === 'd'
  );
}
