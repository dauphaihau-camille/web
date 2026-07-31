'use client';

import { useEffect } from 'react';
import { useExtension } from '@blocknote/react';

import { dragHandleMenuSelectionExtension } from '../drag-handle-menu-selection-extension';

type ActiveBlockHighlightProps = {
  blockId: string;
};

export function ActiveBlockHighlight({
  blockId,
}: ActiveBlockHighlightProps) {
  const dragHandleMenuSelection = useExtension(
    dragHandleMenuSelectionExtension,
  );

  useEffect(() => {
    dragHandleMenuSelection.setSelectedBlock(blockId);

    return () => {
      dragHandleMenuSelection.setSelectedBlock(null);
    };
  }, [blockId, dragHandleMenuSelection]);

  return null;
}
