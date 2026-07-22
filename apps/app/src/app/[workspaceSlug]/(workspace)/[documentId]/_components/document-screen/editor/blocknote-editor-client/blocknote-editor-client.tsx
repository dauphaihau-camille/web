'use client';

import type {
  Block,
} from '@blocknote/core';
import { createBlockNoteEditorClient } from '@shared/components/editor/blocknote-editor-client/create-blocknote-editor-client';

import { DOCUMENT_SUBDOC_CREATED_EVENT } from '@/domains/document/document-subdoc-created-event';

import { blockNoteSchema } from '../blocknote-schema';
import { normalizeBlockNoteContent } from '../normalize-blocknote-content';
import { blockNoteEditorClientStyles } from './blocknote-editor-client.styles';
import { SlashMenu } from './slash-menu';

const HIDDEN_SLASH_MENU_TITLES = [
  'Image',
  'Video',
  'Audio',
  'File',
];

function getInlineText(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return '';
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return '';
    }

    const text = (item as { text?: unknown }).text;
    return typeof text === 'string' ? text : '';
  }).join('');
}

function shouldReplaceSlashAnchorBlock(
  block: Block,
  slashCommandText: string,
) {
  if (block.type !== 'paragraph') {
    return false;
  }

  const inlineText = getInlineText((block as { content?: unknown }).content).trim();
  const hasChildren = Array.isArray(block.children) && block.children.length > 0;

  if (hasChildren) {
    return false;
  }

  if (inlineText === slashCommandText.trim()) {
    return true;
  }

  return inlineText.length === 0;
}

export const BlockNoteEditorClient = createBlockNoteEditorClient({
  SlashMenuComponent: SlashMenu,
  externalSubdocCreatedEventName: DOCUMENT_SUBDOC_CREATED_EVENT,
  hiddenSlashMenuTitles: HIDDEN_SLASH_MENU_TITLES,
  normalizeContent: normalizeBlockNoteContent,
  schema: blockNoteSchema,
  shouldSkipSaveWhileExecutingSlashCommand: true,
  styles: blockNoteEditorClientStyles,
  onCreateSubdocSelection: ({
    cancelScheduledSave,
    createSubdoc,
    editor,
    isCollaborative,
    isExecutingSlashCommandRef,
    isSelectingSlashMenuItemRef,
    lastSerializedContentRef,
    pendingSlashMenuSaveRef,
    setIsSaving,
    slashMenuQuery,
    workspaceSlug,
  }) => {
    const anchorBlock = editor.getTextCursorPosition().block as Block;
    const anchorBlockId = anchorBlock.id;
    const slashCommandText = `/${slashMenuQuery.trim()}`;

    const previousContent = JSON.parse(
      JSON.stringify(editor.document as unknown[]),
    ) as unknown[];

    const optimisticSubdocBlock = {
      type: 'subdoc' as const,
      props: {
        documentId: `pending-${anchorBlockId}`,
        publicId: '',
        workspaceId: workspaceSlug,
        title: 'Untitled',
        hasContent: false,
      },
    };

    if (isCollaborative) {
      isExecutingSlashCommandRef.current = true;
      pendingSlashMenuSaveRef.current = null;
      cancelScheduledSave();
      setIsSaving(false);

      void createSubdoc({
        anchorBlockId,
        slashCommandText,
        content: previousContent,
      })
        .then((createdDocument) => {
          const currentAnchorBlock = editor.getBlock(anchorBlockId);

          if (!currentAnchorBlock) {
            return;
          }

          const createdSubdocBlock = {
            type: 'subdoc' as const,
            props: {
              documentId: createdDocument.id,
              publicId: createdDocument.public_id,
              workspaceId: workspaceSlug,
              title: createdDocument.title || 'Untitled',
              hasContent: createdDocument.content.length > 0,
            },
          };

          editor.transact(() => {
            if (shouldReplaceSlashAnchorBlock(currentAnchorBlock as Block, slashCommandText)) {
              editor.updateBlock(currentAnchorBlock, createdSubdocBlock as never);
              return;
            }

            editor.insertBlocks(
              [createdSubdocBlock] as never[],
              currentAnchorBlock,
              'after',
            );
          });
        })
        .catch(() => {})
        .finally(() => {
          isExecutingSlashCommandRef.current = false;
          isSelectingSlashMenuItemRef.current = false;
          pendingSlashMenuSaveRef.current = null;
        });

      return;
    }

    isExecutingSlashCommandRef.current = true;
    pendingSlashMenuSaveRef.current = null;
    cancelScheduledSave();
    setIsSaving(false);

    editor.focus();
    editor.transact(() => {
      if (shouldReplaceSlashAnchorBlock(anchorBlock, slashCommandText)) {
        editor.updateBlock(anchorBlock, optimisticSubdocBlock as never);
        return;
      }

      editor.insertBlocks(
        [optimisticSubdocBlock] as never[],
        anchorBlock,
        'after',
      );
    });

    void createSubdoc({
      anchorBlockId,
      slashCommandText,
      content: previousContent,
    })
      .catch(() => {
        lastSerializedContentRef.current = JSON.stringify(previousContent);
        editor.replaceBlocks(editor.document, previousContent as never[]);
      })
      .finally(() => {
        isExecutingSlashCommandRef.current = false;
        isSelectingSlashMenuItemRef.current = false;
        pendingSlashMenuSaveRef.current = null;
      });
  },
});
