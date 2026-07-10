'use client';

import type { SharedSlashMenuProps } from '@shared/components/editor/blocknote-editor-client/slash-menu';
import { SharedSlashMenu } from '@shared/components/editor/blocknote-editor-client/slash-menu';
import {
  insertOrUpdateBlockForSlashMenu,
} from '@blocknote/core/extensions';
import { blockNoteEditorClientBaseStyles } from '@shared/components/editor/blocknote-editor-client/blocknote-editor-client.styles';
import { createBlockNoteEditorClient } from '@shared/components/editor/blocknote-editor-client/create-blocknote-editor-client';

import { hasMeaningfulContent } from '@shared/components/editor/has-meaningful-content';
import { blockNoteSchema } from '../blocknote-schema';

function SlashMenu(props: SharedSlashMenuProps) {
  return <SharedSlashMenu {...props} />;
}

export const BlockNoteEditorClient = createBlockNoteEditorClient({
  SlashMenuComponent: SlashMenu,
  schema: blockNoteSchema,
  styles: blockNoteEditorClientBaseStyles,
  onCreateSubdocSelection: ({
    createSubdoc,
    editor,
    workspaceSlug,
  }) => {
    void createSubdoc().then((subdoc) => {
      insertOrUpdateBlockForSlashMenu(editor, {
        type: 'subpage' as const,
        props: {
          documentId: subdoc.id,
          publicId: subdoc.public_id,
          workspaceId: workspaceSlug,
          title: subdoc.title,
          hasContent: hasMeaningfulContent(subdoc.content),
        },
      } as never);
    });
  },
});
