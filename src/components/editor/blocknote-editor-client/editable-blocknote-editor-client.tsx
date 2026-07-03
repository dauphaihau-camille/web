'use client';

import dynamic from 'next/dynamic';

import type { Document } from '@/domains/document';

const BlockNoteEditorClient = dynamic(
  () => import('./blocknote-editor-client').then((module) => module.BlockNoteEditorClient),
  {
    ssr: false,
    loading: () => (
      <div className="editor-blocknote-client min-h-[60vh] bg-transparent py-2" />
    ),
  },
);

type EditableBlockNoteEditorClientProps = {
  documentTitle: string;
  content: unknown[];
  documentId?: string;
  workspaceSlug?: string;
  editable?: boolean;
  onContentChangeAction?: (content: unknown[]) => Promise<void>;
  onCreateSubdocAction?: () => Promise<Document>;
  onSelectionChangeAction?: () => void;
  onStartContentChangeAction?: () => void;
};

export function EditableBlockNoteEditorClient(
  props: EditableBlockNoteEditorClientProps,
) {
  return <BlockNoteEditorClient {...props} />;
}
