'use client';

import { useEffect } from 'react';

import { isEmptyParagraphBlock } from '../../blocknote-content-utils';
import { countContentBlocks } from '../../count-content-blocks';
import type { BlockNoteEditorProps } from '../../blocknote-editor.types';
import type { BlockNoteClientEditor } from '../create-blocknote-editor-client.types';

export function useAppendBlocksRequest({
  appendBlocksRequest,
  editor,
  isEditable,
  onCollaborativeContentChangeAction,
}: {
  appendBlocksRequest: BlockNoteEditorProps['appendBlocksRequest'];
  editor: BlockNoteClientEditor;
  isEditable: boolean;
  onCollaborativeContentChangeAction: BlockNoteEditorProps['onCollaborativeContentChangeAction'];
}) {
  useEffect(() => {
    if (!appendBlocksRequest) {
      return;
    }

    if (!isEditable) {
      appendBlocksRequest.onComplete({ ok: false });
      return;
    }

    try {
      const nextBlocks = appendBlocksRequest.blocks as never[];

      const shouldReplaceEmptyDocument =
        editor.document.length === 1 && isEmptyParagraphBlock(editor.document[0]);

      const lastBlock = editor.document.at(-1);
      const previousContent = editor.document as unknown[];

      const nextContent = shouldReplaceEmptyDocument
        ? appendBlocksRequest.blocks
        : [...previousContent, ...appendBlocksRequest.blocks];

      const previousBlockCount = countContentBlocks(previousContent);
      const nextBlockCount = countContentBlocks(nextContent);

      const accepted = onCollaborativeContentChangeAction?.(nextContent, {
        blockCountDelta: nextBlockCount - previousBlockCount,
        nextBlockCount,
        previousBlockCount,
      }) !== false;

      if (!accepted) {
        appendBlocksRequest.onComplete({ ok: false });
        return;
      }

      editor.transact(() => {
        if (shouldReplaceEmptyDocument) {
          editor.replaceBlocks(editor.document, nextBlocks);
          return;
        }

        if (lastBlock) {
          editor.insertBlocks(nextBlocks, lastBlock as never, 'after');
          return;
        }

        editor.replaceBlocks(editor.document, nextBlocks);
      });

      appendBlocksRequest.onComplete({ ok: true });
    }
    catch {
      appendBlocksRequest.onComplete({ ok: false });
    }
  }, [appendBlocksRequest, editor, isEditable, onCollaborativeContentChangeAction]);
}
