'use client';

import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';

import type { BlockNoteEditorProps } from './blocknote-editor.types';

type LoadBlockNoteEditorClient = () => Promise<{
  BlockNoteEditorClient: ComponentType<BlockNoteEditorProps>;
}>;

export function createBlockNoteEditorLoader(
  loadBlockNoteEditorClient: LoadBlockNoteEditorClient,
) {
  const BlockNoteEditorClient = dynamic(
    () => loadBlockNoteEditorClient().then((module) => module.BlockNoteEditorClient),
    {
      ssr: false,
      loading: () => (
        <div className="editor-blocknote-client min-h-[60vh] bg-transparent py-2" />
      ),
    },
  );

  return function BlockNoteEditorLoader(props: BlockNoteEditorProps) {
    return <BlockNoteEditorClient {...props} />;
  };
}
