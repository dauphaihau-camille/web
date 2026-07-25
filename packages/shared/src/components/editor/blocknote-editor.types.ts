import type { useCreateBlockNote } from '@blocknote/react';

type CollaborationOptions = NonNullable<
  NonNullable<Parameters<typeof useCreateBlockNote>[0]>['collaboration']
>;

export type BlockNoteDocumentOperations = {
  isCollaborative?: boolean;
  isArchiving: boolean;
  archivingSubdocumentId?: string | null;
  isDuplicating: boolean;
  onArchive: () => void;
  onArchiveSubdocument?: (documentId: string, content?: unknown[]) => Promise<void>;
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
  collaboration?: CollaborationOptions;
  documentTitle: string;
  content: unknown[];
  documentId?: string;
  workspaceSlug?: string;
  editable?: boolean;
  suppressHoverControls?: boolean;
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
