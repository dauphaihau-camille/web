'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type * as Yjs from 'yjs';

import type { BlockNoteAppendBlocksRequest } from '@shared/components/editor/blocknote-editor.types';
import type { AiChatAppendRequest } from '../../../../../_components/ai-chat-panel/ai-chat-panel.types';
import { useWorkspaceAiChatDocument } from '../../../../../_components/workspace-ai-chat-shell';
import { convertAiAppendResponseToBlocks } from '../ai-append-block-conversion';
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
        blocks: convertAiAppendResponseToBlocks(request.content),
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
