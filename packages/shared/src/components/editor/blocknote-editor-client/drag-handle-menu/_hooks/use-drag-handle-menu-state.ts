'use client';

import { SideMenuExtension } from '@blocknote/core/extensions';
import {
  useBlockNoteEditor,
  useComponentsContext,
  useDictionary,
  useEditorState,
  useExtension,
  useExtensionState,
} from '@blocknote/react';

import type { BlockNoteDocumentOperations } from '../../../blocknote-editor.types';
import {
  getCurrentBlockLabel,
  type EditorBlock,
} from '../editor-block';

export function useDragHandleMenuState(
  documentOperations?: BlockNoteDocumentOperations,
) {
  const Components = useComponentsContext();
  const editor = useBlockNoteEditor();
  const dictionary = useDictionary();
  const sideMenu = useExtension(SideMenuExtension);

  const hoveredBlock = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });

  const selectedBlocks = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) =>
      currentEditor.getSelection()?.blocks ?? [currentEditor.getTextCursorPosition().block],
  });

  const canRenderMenu = Boolean(
    Components
    && documentOperations
    && hoveredBlock
    && selectedBlocks.length > 0,
  );

  const currentBlock = canRenderMenu ? hoveredBlock as EditorBlock : null;
  const currentBlockLabel = currentBlock
    ? getCurrentBlockLabel(currentBlock, dictionary)
    : '';
  const isDocumentBlock = currentBlock?.type === 'subdoc';
  const blocksToActOn = currentBlock && selectedBlocks.some((block) => block.id === currentBlock.id)
    ? selectedBlocks
    : currentBlock ? [currentBlock] : [];

  const subdocumentId =
    currentBlock && typeof currentBlock.props.documentId === 'string'
      ? currentBlock.props.documentId
      : null;

  const sourceWorkspaceId =
    currentBlock && typeof currentBlock.props.workspaceId === 'string'
      ? currentBlock.props.workspaceId
      : '';

  const isArchivingSubdocument = Boolean(
    isDocumentBlock
    && subdocumentId !== null
    && documentOperations?.archivingSubdocumentId === subdocumentId,
  );

  return {
    Components,
    blocksToActOn,
    canRenderMenu,
    currentBlock,
    currentBlockLabel,
    editor,
    isArchivingSubdocument,
    isDocumentBlock,
    sideMenu,
    sourceWorkspaceId,
    subdocumentId,
  };
}
