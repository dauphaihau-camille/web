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
  onDuplicate: (documentId?: string) => void | Promise<DuplicatedSubdoc | void>;
  onDuplicateSubdocumentUndoMetadata?: (
    metadata: DuplicatedSubdocUndoMetadata,
  ) => void;
};

export type CreatedSubdoc = {
  id: string;
  public_id: string;
  title: string;
  content: unknown[];
  published_document_id?: string;
};

export type DuplicatedSubdoc = CreatedSubdoc & {
  workspace_id?: string;
};

export type DuplicatedSubdocUndoMetadata = {
  anchorBlockId: string;
  duplicatedSubdocumentId: string;
  sourceSubdocumentId: string;
};

export type BlockNoteSessionUndoRedoBridge = {
  redo: (context?: { preferredBlockId?: string }) => boolean | Promise<boolean>;
  undo: (context?: { preferredBlockId?: string }) => boolean | Promise<boolean>;
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
  onCollaborativeContentChangeAction?: () => void;
  onSessionUndoRedoBridgeChangeAction?: (
    bridge: BlockNoteSessionUndoRedoBridge | null,
  ) => void;
  onSelectionChangeAction?: () => void;
  onStartContentChangeAction?: () => void;
};
