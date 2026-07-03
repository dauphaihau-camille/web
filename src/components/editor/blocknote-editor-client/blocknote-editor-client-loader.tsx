'use client';

import dynamic from 'next/dynamic';

const BlockNoteEditorClient = dynamic(
  () => import('./blocknote-editor-client').then((module) => module.BlockNoteEditorClient),
  {
    ssr: false,
    loading: () => (
      <div className="editor-blocknote-client min-h-[60vh] bg-transparent py-2" />
    ),
  },
);

type BlockNoteEditorClientLoaderProps = {
  documentTitle: string;
  content: unknown[];
  documentId?: string;
  workspaceSlug?: string;
  editable?: boolean;
};

export function BlockNoteEditorClientLoader(
  props: BlockNoteEditorClientLoaderProps,
) {
  return <BlockNoteEditorClient {...props} />;
}
