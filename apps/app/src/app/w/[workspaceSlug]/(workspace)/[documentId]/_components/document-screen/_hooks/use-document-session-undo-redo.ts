'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
} from 'react';
import { PluginKey } from 'prosemirror-state';
import { toast } from 'sonner';
import * as Yjs from 'yjs';

import {
  BROADCAST_COLLABORATION_ORIGIN,
  SOCKET_COLLABORATION_ORIGIN,
} from './use-document-collaboration/document-collaboration.constants';

export const DOCUMENT_LOCAL_EDIT_ORIGIN = Symbol('document-local-edit');
export const DOCUMENT_SYSTEM_SYNC_ORIGIN = Symbol('document-system-sync');
const COMMAND_UNDO_METADATA_CAPTURE_TIMEOUT_MS = 5_000;
const COMMAND_UNDO_METADATA_KEY = Symbol('command-undo-metadata');

type UseDocumentSessionUndoRedoArgs = {
  archiveRestoredSubdocument?: (subdocumentId: string) => Promise<void>;
  bodyUndoRedoBridgeRef: RefObject<BodyUndoRedoBridge | null>;
  bodyEditorRef: RefObject<HTMLElement | null>;
  document: Yjs.Doc;
  enabled: boolean;
  restoreArchivedSubdocument?: (subdocumentId: string) => Promise<void>;
  titleInputRef: RefObject<HTMLElement | null>;
};

type ArchiveSubdocumentUndoMetadata = {
  subdocumentId: string;
  type: 'archiveSubdocument';
};

type CreateSubdocumentUndoMetadata = {
  anchorBlockId: string;
  type: 'createSubdocument';
};

type DuplicateSubdocumentUndoMetadata = {
  anchorBlockId: string;
  duplicatedSubdocumentId: string;
  sourceSubdocumentId: string;
  type: 'duplicateSubdocument';
};

export type CommandUndoMetadata =
  | ArchiveSubdocumentUndoMetadata
  | CreateSubdocumentUndoMetadata
  | DuplicateSubdocumentUndoMetadata;

export type BodyUndoRedoBridge = {
  redo: (context?: { preferredBlockId?: string }) => boolean | Promise<boolean>;
  undo: (context?: { preferredBlockId?: string }) => boolean | Promise<boolean>;
};

type UndoStackItem = {
  meta?: Map<unknown, unknown>;
};

type StackItemEvent = {
  stackItem: UndoStackItem;
  type: 'undo' | 'redo';
};

type TransactionEvent = {
  origin: unknown;
};

export function useDocumentSessionUndoRedo({
  archiveRestoredSubdocument,
  bodyUndoRedoBridgeRef,
  bodyEditorRef,
  document,
  enabled,
  restoreArchivedSubdocument,
  titleInputRef,
}: UseDocumentSessionUndoRedoArgs) {
  const archiveRestoredSubdocumentRef = useRef(archiveRestoredSubdocument);
  const bodyCommandRedoMetadataStackRef = useRef<CommandUndoMetadata[]>([]);
  const commandUndoMetadataRef = useRef(new WeakMap<UndoStackItem, CommandUndoMetadata>());
  const isExecutingUndoRedoRef = useRef(false);
  const pendingCommandUndoMetadataClearTimerRef = useRef<number | null>(null);
  const pendingCommandUndoMetadataRef = useRef<CommandUndoMetadata | null>(null);
  const restoreArchivedSubdocumentRef = useRef(restoreArchivedSubdocument);
  const undoManagerRef = useRef<Yjs.UndoManager | null>(null);

  useEffect(() => {
    archiveRestoredSubdocumentRef.current = archiveRestoredSubdocument;
    restoreArchivedSubdocumentRef.current = restoreArchivedSubdocument;
  }, [
    archiveRestoredSubdocument,
    restoreArchivedSubdocument,
  ]);

  const executeUndoRedo = useCallback(async ({
    isRedo,
    isBodyUndoRedo,
    undoManager,
  }: {
    isRedo: boolean;
    isBodyUndoRedo: boolean;
    undoManager: Yjs.UndoManager;
  }) => {
    if (isExecutingUndoRedoRef.current) {
      return;
    }

    const stack = isRedo ? undoManager.redoStack : undoManager.undoStack;
    const stackItem = stack.at(-1) as UndoStackItem | undefined;

    if (!stackItem && !isBodyUndoRedo) {
      return;
    }

    const metadata = stackItem
      ? getCommandUndoMetadata(
        stackItem,
        commandUndoMetadataRef.current,
      )
      : undefined;
    const bodyMetadata = isRedo
      ? bodyCommandRedoMetadataStackRef.current.at(-1) ?? metadata
      : metadata;

    isExecutingUndoRedoRef.current = true;

    try {
      if (isBodyUndoRedo) {
        if (!bodyMetadata) {
          if (!stackItem) {
            return;
          }

          if (isRedo) {
            undoManager.redo();
            return;
          }

          undoManager.undo();
          return;
        }

        await compensateCommandUndoRedo({
          archiveRestoredSubdocument: archiveRestoredSubdocumentRef.current,
          isRedo,
          metadata: bodyMetadata,
          restoreArchivedSubdocument: restoreArchivedSubdocumentRef.current,
        });

        const bodyUndoRedoBridge = bodyUndoRedoBridgeRef.current;
        const context = {
          preferredBlockId: getPreferredCursorBlockId(bodyMetadata),
        };
        const applied = bodyUndoRedoBridge
          ? isRedo
            ? await bodyUndoRedoBridge.redo(context)
            : await bodyUndoRedoBridge.undo(context)
          : isRedo
            ? Boolean(undoManager.redo())
            : Boolean(undoManager.undo());

        if (!applied) {
          return;
        }

        if (isRedo) {
          bodyCommandRedoMetadataStackRef.current.pop();
        }
        else if (bodyMetadata) {
          bodyCommandRedoMetadataStackRef.current.push(bodyMetadata);
        }

        return;
      }

      await compensateCommandUndoRedo({
        archiveRestoredSubdocument: archiveRestoredSubdocumentRef.current,
        isRedo,
        metadata,
        restoreArchivedSubdocument: restoreArchivedSubdocumentRef.current,
      });

      if (isRedo) {
        undoManager.redo();
        return;
      }

      undoManager.undo();
    }
    catch {
      toast('Could not complete undo');
      if (stackItem) {
        commandUndoMetadataRef.current.delete(stackItem);
      }
    }
    finally {
      isExecutingUndoRedoRef.current = false;
    }
  }, [bodyUndoRedoBridgeRef]);

  useEffect(() => {
    const handleCommandTransactionOrigin = (transaction: TransactionEvent) => {
      if (
        !pendingCommandUndoMetadataRef.current
        || isSystemOrRemoteOrigin(transaction.origin)
      ) {
        return;
      }

      undoManagerRef.current?.addTrackedOrigin(transaction.origin);
    };

    document.on('afterTransaction', handleCommandTransactionOrigin);

    const undoManager = new Yjs.UndoManager(document, {
      captureTimeout: 500,
      captureTransaction: (transaction) => {
        if (isSystemOrRemoteOrigin(transaction.origin)) {
          return false;
        }

        return Boolean(pendingCommandUndoMetadataRef.current)
          || isTrackedUndoOrigin(transaction.origin);
      },
      trackedOrigins: new Set([
        null,
        DOCUMENT_LOCAL_EDIT_ORIGIN,
        // BlockNote body edits arrive through y-prosemirror with a PluginKey origin.
        PluginKey,
      ]),
    });
    undoManagerRef.current = undoManager;

    const handleStackItemChanged = (event: StackItemEvent) => {
      const metadata = pendingCommandUndoMetadataRef.current;

      if (!metadata) {
        return;
      }

      setCommandUndoMetadata(
        event.stackItem,
        metadata,
        commandUndoMetadataRef.current,
      );
      pendingCommandUndoMetadataRef.current = null;
      clearPendingCommandUndoMetadataTimer(pendingCommandUndoMetadataClearTimerRef);
      undoManager.stopCapturing();
    };

    const handleStackItemPopped = (event: StackItemEvent) => {
      const metadata = getCommandUndoMetadata(
        event.stackItem,
        commandUndoMetadataRef.current,
      );

      if (!metadata) {
        return;
      }

      commandUndoMetadataRef.current.delete(event.stackItem);

      const nextStack = event.type === 'undo'
        ? undoManager.redoStack
        : undoManager.undoStack;
      const nextStackItem = nextStack.at(-1) as UndoStackItem | undefined;

      if (nextStackItem) {
        setCommandUndoMetadata(
          nextStackItem,
          metadata,
          commandUndoMetadataRef.current,
        );
      }
    };

    undoManager.on('stack-item-added', handleStackItemChanged);
    undoManager.on('stack-item-updated', handleStackItemChanged);
    undoManager.on('stack-item-popped', handleStackItemPopped);

    if (!enabled) {
      undoManager.clear();
      bodyCommandRedoMetadataStackRef.current = [];
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabled || !isUndoRedoShortcut(event)) {
        return;
      }

      const target = event.target;
      const isBodyUndoRedo = target instanceof Element
        && Boolean(bodyEditorRef.current?.contains(target));
      const isEditingSurfaceUndoRedo = target instanceof Element
        && isWithinEditingSurface(target, {
          bodyEditor: bodyEditorRef.current,
          titleInput: titleInputRef.current,
        });
      const commandMetadata = getUndoRedoStackItemMetadata({
        fallbackMetadata: commandUndoMetadataRef.current,
        isRedo: isRedoShortcut(event),
        undoManager,
      });
      const hasUndoRedoStackItem = (isRedoShortcut(event)
        ? undoManager.redoStack
        : undoManager.undoStack).length > 0;
      const hasBodyCommandRedoMetadata = isRedoShortcut(event)
        && bodyCommandRedoMetadataStackRef.current.length > 0;

      if (
        isBodyUndoRedo
        && !commandMetadata
        && !hasBodyCommandRedoMetadata
        && !hasUndoRedoStackItem
      ) {
        return;
      }

      if (!isEditingSurfaceUndoRedo && !commandMetadata) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      void executeUndoRedo({
        isRedo: isRedoShortcut(event),
        isBodyUndoRedo,
        undoManager,
      });
    };

    window.document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.document.removeEventListener('keydown', handleKeyDown, true);
      document.off('afterTransaction', handleCommandTransactionOrigin);
      undoManager.off('stack-item-added', handleStackItemChanged);
      undoManager.off('stack-item-updated', handleStackItemChanged);
      undoManager.off('stack-item-popped', handleStackItemPopped);
      undoManager.clear();
      (undoManager as Yjs.UndoManager & { destroy?: () => void }).destroy?.();
      bodyCommandRedoMetadataStackRef.current = [];
      commandUndoMetadataRef.current = new WeakMap();
      pendingCommandUndoMetadataRef.current = null;
      clearPendingCommandUndoMetadataTimer(pendingCommandUndoMetadataClearTimerRef);
      undoManagerRef.current = null;
    };
  }, [
    bodyEditorRef,
    document,
    enabled,
    executeUndoRedo,
    titleInputRef,
  ]);

  const registerCommandUndoMetadata = useCallback((metadata: CommandUndoMetadata) => {
    clearPendingCommandUndoMetadataTimer(pendingCommandUndoMetadataClearTimerRef);
    pendingCommandUndoMetadataRef.current = metadata;
    undoManagerRef.current?.stopCapturing();

    pendingCommandUndoMetadataClearTimerRef.current = window.setTimeout(() => {
      if (pendingCommandUndoMetadataRef.current === metadata) {
        pendingCommandUndoMetadataRef.current = null;
      }

      pendingCommandUndoMetadataClearTimerRef.current = null;
    }, COMMAND_UNDO_METADATA_CAPTURE_TIMEOUT_MS);
  }, []);

  return {
    registerCommandUndoMetadata,
  };
}


// ---------- Private helpers ----------

function clearPendingCommandUndoMetadataTimer(
  timerRef: RefObject<number | null>,
) {
  if (timerRef.current === null) {
    return;
  }

  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

function getCommandUndoMetadata(
  stackItem: UndoStackItem,
  fallbackMetadata: WeakMap<UndoStackItem, CommandUndoMetadata>,
) {
  return (
    stackItem.meta?.get(COMMAND_UNDO_METADATA_KEY) as CommandUndoMetadata | undefined
  ) ?? fallbackMetadata.get(stackItem);
}

function setCommandUndoMetadata(
  stackItem: UndoStackItem,
  metadata: CommandUndoMetadata,
  fallbackMetadata: WeakMap<UndoStackItem, CommandUndoMetadata>,
) {
  stackItem.meta?.set(COMMAND_UNDO_METADATA_KEY, metadata);
  fallbackMetadata.set(stackItem, metadata);
}

function getUndoRedoStackItemMetadata({
  fallbackMetadata,
  isRedo,
  undoManager,
}: {
  fallbackMetadata: WeakMap<UndoStackItem, CommandUndoMetadata>;
  isRedo: boolean;
  undoManager: Yjs.UndoManager;
}) {
  const stack = isRedo ? undoManager.redoStack : undoManager.undoStack;
  const stackItem = stack.at(-1) as UndoStackItem | undefined;

  if (!stackItem) {
    return undefined;
  }

  return getCommandUndoMetadata(stackItem, fallbackMetadata);
}

function isSystemOrRemoteOrigin(origin: unknown) {
  return origin === BROADCAST_COLLABORATION_ORIGIN
    || origin === DOCUMENT_SYSTEM_SYNC_ORIGIN
    || origin === SOCKET_COLLABORATION_ORIGIN;
}

function isTrackedUndoOrigin(origin: unknown) {
  return origin === null
    || origin === DOCUMENT_LOCAL_EDIT_ORIGIN
    || origin instanceof Yjs.UndoManager
    || origin instanceof PluginKey
    || origin === PluginKey;
}

async function compensateCommandUndoRedo({
  archiveRestoredSubdocument,
  isRedo,
  metadata,
  restoreArchivedSubdocument,
}: {
  archiveRestoredSubdocument?: (subdocumentId: string) => Promise<void>;
  isRedo: boolean;
  metadata?: CommandUndoMetadata;
  restoreArchivedSubdocument?: (subdocumentId: string) => Promise<void>;
}) {
  if (!metadata) {
    return;
  }

  if (
    metadata.type === 'archiveSubdocument'
    || metadata.type === 'duplicateSubdocument'
  ) {
    const subdocumentId = metadata.type === 'archiveSubdocument'
      ? metadata.subdocumentId
      : metadata.duplicatedSubdocumentId;

    if (metadata.type === 'archiveSubdocument') {
      if (isRedo) {
        if (!archiveRestoredSubdocument) {
          throw new Error('Missing archive compensation command.');
        }

        await archiveRestoredSubdocument(subdocumentId);
        return;
      }

      if (!restoreArchivedSubdocument) {
        throw new Error('Missing restore compensation command.');
      }

      await restoreArchivedSubdocument(subdocumentId);
      return;
    }

    if (isRedo) {
      if (!restoreArchivedSubdocument) {
        throw new Error('Missing restore compensation command.');
      }

      await restoreArchivedSubdocument(subdocumentId);
      return;
    }

    if (!archiveRestoredSubdocument) {
      throw new Error('Missing archive compensation command.');
    }

    await archiveRestoredSubdocument(subdocumentId);
  }
}

function getPreferredCursorBlockId(metadata?: CommandUndoMetadata) {
  if (
    metadata?.type === 'createSubdocument'
    || metadata?.type === 'duplicateSubdocument'
  ) {
    return metadata.anchorBlockId;
  }

  return undefined;
}

function isWithinEditingSurface(
  target: Element,
  surfaces: {
    bodyEditor: HTMLElement | null;
    titleInput: HTMLElement | null;
  },
) {
  return Boolean(
    (surfaces.titleInput && surfaces.titleInput.contains(target))
    || (surfaces.bodyEditor && surfaces.bodyEditor.contains(target)),
  );
}

function isUndoRedoShortcut(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) {
    return false;
  }

  const key = event.key.toLowerCase();

  return key === 'z' || key === 'y';
}

function isRedoShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();

  return key === 'y' || (key === 'z' && event.shiftKey);
}
