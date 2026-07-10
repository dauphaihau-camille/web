export type BlockNoteDocumentOperations = {
  isArchiving: boolean;
  archivingSubdocumentId?: string | null;
  isDuplicating: boolean;
  onArchive: () => void;
  onArchiveSubdocument?: (documentId: string) => Promise<void>;
  onCopyLink: () => void | Promise<void>;
  onDuplicate: (documentId?: string) => void;
};

export type CreatedSubdoc = {
  id: string;
  public_id: string;
  title: string;
  content: unknown[];
};

export type BlockNoteEditorProps = {
  documentTitle: string;
  content: unknown[];
  documentId?: string;
  workspaceSlug?: string;
  editable?: boolean;
  documentOperations?: BlockNoteDocumentOperations;
  onContentChangeAction?: (content: unknown[]) => Promise<void>;
  onCreateSubdocAction?: (input?: {
    anchorBlockId?: string;
    slashCommandText?: string;
    content?: unknown[];
  }) => Promise<CreatedSubdoc>;
  onSelectionChangeAction?: () => void;
  onStartContentChangeAction?: () => void;
};
