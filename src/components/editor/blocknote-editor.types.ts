import type { Document } from '@/domains/document';

export type BlockNoteDocumentOperations = {
  isArchiving: boolean;
  isDuplicating: boolean;
  onArchive: () => void;
  onCopyLink: () => void | Promise<void>;
  onDuplicate: () => void;
};

export type BlockNoteEditorProps = {
  documentTitle: string;
  content: unknown[];
  documentId?: string;
  workspaceSlug?: string;
  editable?: boolean;
  documentOperations?: BlockNoteDocumentOperations;
  onContentChangeAction?: (content: unknown[]) => Promise<void>;
  onCreateSubdocAction?: () => Promise<Document>;
  onSelectionChangeAction?: () => void;
  onStartContentChangeAction?: () => void;
};
