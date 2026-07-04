import { BlockNoteEditorClientLoader } from './blocknote-editor-client/blocknote-editor-client-loader';

type BlockNoteEditorProps = {
  documentTitle: string;
  content: unknown[];
  documentId?: string;
  workspaceSlug?: string;
  editable?: boolean;
};

export function BlockNoteEditor(props: BlockNoteEditorProps) {
  return <BlockNoteEditorClientLoader {...props} />;
}
