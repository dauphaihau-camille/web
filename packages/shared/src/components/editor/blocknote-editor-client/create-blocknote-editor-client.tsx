'use client';

import type { ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import { useCreateBlockNote, SuggestionMenuController } from '@blocknote/react';
import { BlockNoteView, ShadCNDefaultComponents } from '@blocknote/shadcn';
import { useTheme } from 'next-themes';

import type { BlockNoteEditorProps } from '../blocknote-editor.types';
import { blockNoteViewClassName } from './blocknote-view-class-name';
import type { CreateBlockNoteEditorClientOptions } from './create-blocknote-editor-client.types';
import { dragHandleMenuSelectionExtension } from './drag-handle-menu-selection-extension';
import { editorKeyboardExtension } from './editor-keyboard-extension';
import { useAppendBlocksRequest } from './_hooks/use-append-blocks-request';
import { useEditorKeyboardCapture } from './_hooks/use-editor-keyboard-capture';
import { useEditorSaveController } from './_hooks/use-editor-save-controller';
import { useExternalSubdocCreated } from './_hooks/use-external-subdoc-created';
import { useSessionUndoRedoHandler } from './_hooks/use-session-undo-redo-handler';
import { useSlashMenuItems } from './_hooks/use-slash-menu-items';
import { EditorSideMenuController } from './side-menu-controller';

const bodyPortaledDropdownMenuComponents = {
  ...ShadCNDefaultComponents.DropdownMenu,
  DropdownMenuContent: BodyPortaledDropdownMenuContent,
  DropdownMenuSubContent: BodyPortaledDropdownMenuSubContent,
};

function BodyPortaledDropdownMenuContent(
  props: ComponentProps<typeof ShadCNDefaultComponents.DropdownMenu.DropdownMenuContent>,
) {
  const content = (
    <ShadCNDefaultComponents.DropdownMenu.DropdownMenuContent {...props} />
  );

  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}

function BodyPortaledDropdownMenuSubContent(
  props: ComponentProps<typeof ShadCNDefaultComponents.DropdownMenu.DropdownMenuSubContent>,
) {
  const content = (
    <ShadCNDefaultComponents.DropdownMenu.DropdownMenuSubContent {...props} />
  );

  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}

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
    appendBlocksRequest,
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

    useAppendBlocksRequest({
      appendBlocksRequest,
      editor,
      isEditable,
      onCollaborativeContentChangeAction,
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
          shadCNComponents={{
            DropdownMenu: bodyPortaledDropdownMenuComponents,
          }}
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
                  portalElement={null}
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
