'use client';

import { useCreateBlockNote, SuggestionMenuController } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { useTheme } from 'next-themes';

import type { BlockNoteEditorProps } from '../blocknote-editor.types';
import { blockNoteViewClassName } from './blocknote-view-class-name';
import type { CreateBlockNoteEditorClientOptions } from './create-blocknote-editor-client.types';
import { dragHandleMenuSelectionExtension } from './drag-handle-menu-selection-extension';
import { editorKeyboardExtension } from './editor-keyboard-extension';
import { useEditorKeyboardCapture } from './_hooks/use-editor-keyboard-capture';
import { useEditorSaveController } from './_hooks/use-editor-save-controller';
import { useExternalSubdocCreated } from './_hooks/use-external-subdoc-created';
import { useSessionUndoRedoHandler } from './_hooks/use-session-undo-redo-handler';
import { useSlashMenuItems } from './_hooks/use-slash-menu-items';
import { EditorSideMenuController } from './side-menu-controller';

export function createBlockNoteEditorClient({
  SlashMenuComponent,
  externalSubdocCreatedEventName,
  hiddenSlashMenuTitles = [],
  normalizeContent,
  schema,
  shouldSkipSaveWhileExecutingSlashCommand = false,
  styles,
  onCreateSubdocSelection,
}: CreateBlockNoteEditorClientOptions) {
  const hiddenSlashMenuTitleSet = new Set(hiddenSlashMenuTitles);

  return function BlockNoteEditorClient({
    collaboration,
    documentTitle,
    content,
    documentId,
    workspaceSlug = '',
    editable = true,
    suppressHoverControls = false,
    documentOperations,
    onCollaborativeContentChangeAction,
    onContentChangeAction,
    onCreateSubdocAction,
    onSessionUndoRedoBridgeChangeAction,
    onSelectionChangeAction,
    onStartContentChangeAction,
  }: BlockNoteEditorProps) {
    const { resolvedTheme } = useTheme();
    const normalizedContent = normalizeContent ? normalizeContent(content) : content;
    const isEditable = editable && Boolean(onContentChangeAction || collaboration);

    const editor = useCreateBlockNote({
      schema,
      ...(collaboration
        ? { collaboration }
        : { initialContent: normalizedContent as never[] }),
      extensions: [
        editorKeyboardExtension,
        dragHandleMenuSelectionExtension(),
      ],
    }, [collaboration?.fragment]);

    useSessionUndoRedoHandler({
      editor,
      onSessionUndoRedoBridgeChangeAction,
    });

    useExternalSubdocCreated({
      documentId,
      editor,
      externalSubdocCreatedEventName,
      workspaceSlug,
    });

    useEditorKeyboardCapture(editor);

    const {
      cancelScheduledSave,
      handleEditorChange,
      handleSlashMenuOpenChange,
      isExecutingSlashCommandRef,
      isSelectingSlashMenuItemRef,
      lastSerializedContentRef,
      pendingSlashMenuSaveRef,
      setIsSaving,
    } = useEditorSaveController({
      collaboration,
      editor,
      isEditable,
      normalizedContent,
      onCollaborativeContentChangeAction,
      onContentChangeAction,
      onStartContentChangeAction,
      shouldSkipSaveWhileExecutingSlashCommand,
    });

    const {
      getSlashMenuItems,
      slashMenuQuery,
    } = useSlashMenuItems({
      cancelScheduledSave,
      collaboration,
      documentTitle,
      editor,
      hiddenSlashMenuTitleSet,
      isExecutingSlashCommandRef,
      isSelectingSlashMenuItemRef,
      lastSerializedContentRef,
      onCreateSubdocAction,
      onCreateSubdocSelection,
      pendingSlashMenuSaveRef,
      setIsSaving,
      workspaceSlug,
    });

    return (
      <div className="editor-blocknote-client">
        <BlockNoteView
          sideMenu={false}
          editor={editor}
          editable={isEditable}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          slashMenu={false}
          className={blockNoteViewClassName}
          onSelectionChange={onSelectionChangeAction}
          onChange={handleEditorChange}
        >
          {isEditable
            ? (
              <>
                {!suppressHoverControls
                  ? (
                    <EditorSideMenuController
                      documentOperations={documentOperations}
                    />
                  )
                  : null}
                <SuggestionMenuController
                  triggerCharacter="/"
                  shouldOpen={(state) =>
                    !state.selection.$from.parent.type.isInGroup('tableContent')
                  }
                  onItemClick={(item) => {
                    isSelectingSlashMenuItemRef.current = true;
                    item.onItemClick();
                  }}
                  floatingUIOptions={{
                    useFloatingOptions: {
                      onOpenChange: handleSlashMenuOpenChange,
                    },
                  }}
                  getItems={getSlashMenuItems}
                  suggestionMenuComponent={(props) => (
                    <SlashMenuComponent
                      {...props}
                      query={slashMenuQuery}
                    />
                  )}
                />
              </>
            )
            : null}
        </BlockNoteView>

        <style>{styles}</style>
      </div>
    );
  };
}
