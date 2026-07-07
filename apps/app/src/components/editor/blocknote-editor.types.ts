import type { Document } from '@shared/domains/document';

export type BlockNoteDocumentOperations = {
  isArchiving: boolean;
  archivingSubdocumentId?: string | null;
  isDuplicating: boolean;
  onArchive: () => void;
  onArchiveSubdocument?: (documentId: string) => Promise<void>;
  onCopyLink: () => void | Promise<void>;
  onDuplicate: (documentId?: string) => void;
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
