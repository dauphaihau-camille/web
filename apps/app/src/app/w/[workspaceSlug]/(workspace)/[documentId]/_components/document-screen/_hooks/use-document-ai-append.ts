'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type * as Yjs from 'yjs';

import type { BlockNoteAppendBlocksRequest } from '@shared/components/editor/blocknote-editor.types';
import type { AiChatAppendRequest, AiResponseBlock } from '../../../../../_components/ai-chat-panel/ai-chat-panel.types';
import { useWorkspaceAiChatDocument } from '../../../../../_components/workspace-ai-chat-shell';
import { DOCUMENT_SYSTEM_SYNC_ORIGIN } from './use-document-session-undo-redo';

export function useDocumentAiAppend({
  canEditDocument,
  collaborationDocument,
  collaborationUserName,
  documentId,
  savedTitle,
}: {
  canEditDocument: boolean;
  collaborationDocument: Yjs.Doc;
  collaborationUserName: string;
  documentId: string;
  savedTitle: string;
}) {
  const aiChatDocument = useWorkspaceAiChatDocument();
  const appendRequestIdRef = useRef(0);

  const [appendBlocksRequest, setAppendBlocksRequest] =
    useState<BlockNoteAppendBlocksRequest | undefined>();

  const appendAiResponseToDocument = useCallback((request: AiChatAppendRequest) =>
    new Promise<void>((resolve, reject) => {
      if (!canEditDocument) {
        reject(new Error('Document is not editable'));
        return;
      }

      const requestId = `ai-append-${appendRequestIdRef.current + 1}`;
      appendRequestIdRef.current += 1;

      const metadata = {
        actionType: 'append',
        conversationSessionId: request.conversationSessionId,
        assistantMessageId: request.assistantMessageId,
        actorName: collaborationUserName,
        timestamp: new Date().toISOString(),
      };

      setAppendBlocksRequest({
        id: requestId,
        blocks: prepareBlocksForDocumentAppend(request.responseBlockPayload),
        metadata,
        onComplete: ({ ok }) => {
          setAppendBlocksRequest((currentRequest) =>
            currentRequest?.id === requestId ? undefined : currentRequest,
          );
          if (ok) {
            collaborationDocument.transact(() => {
              collaborationDocument
                .getArray('ai_assisted_edit_metadata')
                .push([metadata]);
            }, DOCUMENT_SYSTEM_SYNC_ORIGIN);
            resolve();
            return;
          }

          reject(new Error('Could not append to document'));
        },
      });
    }), [
    canEditDocument,
    collaborationDocument,
    collaborationUserName,
  ]);

  useEffect(() => {
    if (!aiChatDocument) {
      return;
    }

    return aiChatDocument.registerCurrentDocument({
      id: documentId,
      title: savedTitle,
      onAppendResponse: canEditDocument ? appendAiResponseToDocument : undefined,
    });
  }, [
    aiChatDocument,
    appendAiResponseToDocument,
    canEditDocument,
    documentId,
    savedTitle,
  ]);

  return { appendBlocksRequest };
}

function prepareBlocksForDocumentAppend(blocks: AiResponseBlock[]): unknown[] {
  const preparedBlocks: DocumentAppendBlock[] = [];
  let numberedListStart = 1;

  for (const block of blocks) {
    const preparedBlock = prepareSingleBlockForDocumentAppend(block, numberedListStart);

    if (block.type === 'numberedListItem') {
      numberedListStart += 1;
    }
    else if (block.type !== 'paragraph') {
      numberedListStart = 1;
    }

    preparedBlocks.push(preparedBlock);
  }

  return preparedBlocks;
}

type DocumentAppendBlock = {
  type: string;
  content: AiResponseBlock['content'];
  props?: Record<string, unknown>;
};

function prepareSingleBlockForDocumentAppend(block: AiResponseBlock, numberedListStart: number): DocumentAppendBlock {
  if (isQuoteBlock(block)) {
    return {
      type: 'quote',
      content: removeQuoteMarker(block).content,
    };
  }

  return {
    type: block.type,
    content: block.content,
    ...(block.type === 'heading' ? { props: getDocumentAppendHeadingProps(block) } : {}),
    ...(block.type === 'numberedListItem' && numberedListStart > 1 ? { props: { ...block.props, start: numberedListStart } } : {}),
    ...(block.type !== 'heading' && block.type !== 'numberedListItem' && block.props ? { props: block.props } : {}),
  };
}

function getDocumentAppendHeadingProps(block: AiResponseBlock): { level: number } {
  const level = block.props?.level ?? 1;

  return { level: Math.min(level + 1, 3) };
}


function isQuoteBlock(block: AiResponseBlock) {
  return block.type === 'paragraph' && block.content[0]?.text.trimStart().startsWith('>');
}

function removeQuoteMarker(block: AiResponseBlock): AiResponseBlock {
  const [firstInline, ...remainingContent] = block.content;

  if (!firstInline) {
    return block;
  }

  return {
    ...block,
    content: [
      {
        ...firstInline,
        text: firstInline.text.replace(/^\s*>\s?/, ''),
      },
      ...remainingContent,
    ],
  };
}
