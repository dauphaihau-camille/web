'use client';

import { createBlockNoteEditorLoader } from '@shared/components/editor/create-blocknote-editor-loader';

export const BlockNoteEditorLoader = createBlockNoteEditorLoader(
  () => import('./blocknote-editor-client/blocknote-editor-client'),
);
