import type { Document } from '@/domains/document';

import { EditableBlockNoteEditorClient } from './blocknote-editor-client/editable-blocknote-editor-client';

type EditableBlockNoteEditorProps = {
  documentTitle: string;
  content: unknown[];
  documentId?: string;
  workspaceSlug?: string;
  editable?: boolean;
  onContentChange?: (content: unknown[]) => Promise<void>;
  onCreateSubdoc?: () => Promise<Document>;
  onSelectionChange?: () => void;
  onStartContentChange?: () => void;
};

export function EditableBlockNoteEditor({
  onContentChange,
  onCreateSubdoc,
  onSelectionChange,
  onStartContentChange,
  ...props
}: EditableBlockNoteEditorProps) {
  return (
    <EditableBlockNoteEditorClient
      {...props}
      onContentChangeAction={onContentChange}
      onCreateSubdocAction={onCreateSubdoc}
      onSelectionChangeAction={onSelectionChange}
      onStartContentChangeAction={onStartContentChange}
    />
  );
}
