import type {
  ComponentType,
  RefObject,
} from 'react';
import type { useCreateBlockNote } from '@blocknote/react';

import type { BlockNoteEditorProps } from '../blocknote-editor.types';
import type { SharedSlashMenuProps } from './slash-menu';

export type BlockNoteClientEditor = ReturnType<typeof useCreateBlockNote>;

export type CreateSubdocSelectionContext = {
  cancelScheduledSave: () => void;
  createSubdoc: NonNullable<BlockNoteEditorProps['onCreateSubdocAction']>;
  documentTitle: string;
  editor: BlockNoteClientEditor;
  isCollaborative: boolean;
  isExecutingSlashCommandRef: RefObject<boolean>;
  isSelectingSlashMenuItemRef: RefObject<boolean>;
  lastSerializedContentRef: RefObject<string>;
  pendingSlashMenuSaveRef: RefObject<unknown[] | null>;
  setIsSaving: (value: boolean) => void;
  slashMenuQuery: string;
  workspaceSlug: string;
};

export type CreateBlockNoteEditorClientOptions = {
  SlashMenuComponent: ComponentType<SharedSlashMenuProps>;
  externalSubdocCreatedEventName?: string;
  hiddenSlashMenuTitles?: string[];
  normalizeContent?: (content: unknown[]) => unknown[];
  schema: NonNullable<Parameters<typeof useCreateBlockNote>[0]>['schema'];
  shouldSkipSaveWhileExecutingSlashCommand?: boolean;
  styles: string;
  onCreateSubdocSelection: (context: CreateSubdocSelectionContext) => void;
};
