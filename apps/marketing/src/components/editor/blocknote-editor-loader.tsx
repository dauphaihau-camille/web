'use client';

import dynamic from 'next/dynamic';
import type { BlockNoteEditorProps } from './blocknote-editor.types';

const BlockNoteEditorClient = dynamic(
  () => import('./blocknote-editor-client/blocknote-editor-client').then((module) => module.BlockNoteEditorClient),
  {
    ssr: false,
    loading: () => (
      <div className="editor-blocknote-client min-h-[60vh] bg-transparent py-2" />
    ),
  },
);

export function BlockNoteEditorLoader(props: BlockNoteEditorProps) {
  return <BlockNoteEditorClient {...props} />;
}
