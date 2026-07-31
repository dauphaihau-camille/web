'use client';

import { useState } from 'react';
import {
  filterSuggestionItems,
} from '@blocknote/core/extensions';
import {
  getDefaultReactSlashMenuItems,
  type DefaultReactSuggestionItem,
} from '@blocknote/react';
import { FilePlus2Icon } from 'lucide-react';

import type { BlockNoteEditorProps } from '../../blocknote-editor.types';
import type {
  BlockNoteClientEditor,
  CreateBlockNoteEditorClientOptions,
} from '../create-blocknote-editor-client.types';

export function useSlashMenuItems({
  cancelScheduledSave,
  collaboration,
  documentTitle,
  editor,
  hiddenSlashMenuTitleSet,
  isExecutingSlashCommandRef,
  isSelectingSlashMenuItemRef,
  lastSerializedContentRef,
  onCreateSubdocAction,
  onCreateSubdocSelection,
  pendingSlashMenuSaveRef,
  setIsSaving,
  workspaceSlug,
}: {
  cancelScheduledSave: () => void;
  collaboration: BlockNoteEditorProps['collaboration'];
  documentTitle: string;
  editor: BlockNoteClientEditor;
  hiddenSlashMenuTitleSet: Set<string>;
  isExecutingSlashCommandRef: React.RefObject<boolean>;
  isSelectingSlashMenuItemRef: React.RefObject<boolean>;
  lastSerializedContentRef: React.RefObject<string>;
  onCreateSubdocAction: BlockNoteEditorProps['onCreateSubdocAction'];
  onCreateSubdocSelection: CreateBlockNoteEditorClientOptions['onCreateSubdocSelection'];
  pendingSlashMenuSaveRef: React.RefObject<unknown[] | null>;
  setIsSaving: (value: boolean) => void;
  workspaceSlug: string;
}) {
  const [slashMenuQuery, setSlashMenuQuery] = useState('');

  const getSlashMenuItems = async (query: string) => {
    setSlashMenuQuery(query);

    const defaultItems = getDefaultReactSlashMenuItems(editor).filter(
      (item) => !hiddenSlashMenuTitleSet.has(item.title),
    );

    if (!onCreateSubdocAction) {
      return filterSuggestionItems(
        defaultItems,
        query,
      );
    }

    const createSubdocItem: DefaultReactSuggestionItem = {
      title: 'Document',
      subtext: `Create a nested doc inside ${documentTitle || 'this doc'}`,
      aliases: ['doc', 'document', 'subdoc', 'nested doc', 'child doc'],
      group: 'Basic blocks',
      icon: <FilePlus2Icon size={18} />,
      onItemClick: () => {
        onCreateSubdocSelection({
          cancelScheduledSave,
          createSubdoc: onCreateSubdocAction,
          documentTitle,
          editor,
          isCollaborative: Boolean(collaboration),
          isExecutingSlashCommandRef,
          isSelectingSlashMenuItemRef,
          lastSerializedContentRef,
          pendingSlashMenuSaveRef,
          setIsSaving,
          slashMenuQuery,
          workspaceSlug,
        });
      },
    };

    const insertIndex = defaultItems.findIndex((item) => item.title === 'Divider');
    const slashMenuItems = [...defaultItems];

    if (insertIndex === -1) {
      slashMenuItems.push(createSubdocItem);
    }
    else {
      slashMenuItems.splice(insertIndex, 0, createSubdocItem);
    }

    return filterSuggestionItems(
      slashMenuItems,
      query,
    );
  };

  return {
    getSlashMenuItems,
    slashMenuQuery,
  };
}
