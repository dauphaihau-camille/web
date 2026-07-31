// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { BlockNoteDocumentOperations } from '../blocknote-editor.types';
import { EditorSideMenuController } from './side-menu-controller';

const {
  unfreezeMenuMock,
} = vi.hoisted(() => ({
  unfreezeMenuMock: vi.fn(),
}));

const removeBlocksMock = vi.fn();
const insertBlocksMock = vi.fn();
const archiveSubdocumentMock = vi.fn(() => Promise.resolve());
const focusMock = vi.fn();
const transactMock = vi.fn((callback: () => void) => callback());
const hoveredBlock = {
  id: 'block-1',
  type: 'paragraph',
  props: {},
  content: [],
  children: [],
};

vi.mock('@blocknote/react', async () => {
  const React = await import('react');

  const MenuContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
  } | null>(null);

  function MenuRoot({
    children,
    onOpenChange,
  }: {
    children: ReactNode;
    onOpenChange?: (open: boolean) => void;
  }) {
    const [open, setOpenState] = React.useState(false);
    const setOpen = (nextOpen: boolean) => {
      setOpenState(nextOpen);
      onOpenChange?.(nextOpen);
    };

    return (
      <MenuContext.Provider value={{ open, setOpen }}>
        {children}
      </MenuContext.Provider>
    );
  }

  function MenuTrigger({ children }: { children: ReactNode }) {
    const menu = React.useContext(MenuContext);

    if (!React.isValidElement<{ onClick?: () => void }>(children)) {
      return children;
    }

    return React.cloneElement(children, {
      onClick: () => menu?.setOpen(!menu.open),
    });
  }

  function MenuDropdown({ children }: { children: ReactNode }) {
    const menu = React.useContext(MenuContext);
    return menu?.open ? <div role="menu">{children}</div> : null;
  }

  const sideMenuExtension = {
    blockDragEnd: vi.fn(),
    blockDragStart: vi.fn(),
    freezeMenu: vi.fn(),
    setSelectedBlock: vi.fn(),
    unfreezeMenu: unfreezeMenuMock,
  };
  const Components = {
    Generic: {
      Menu: {
        Dropdown: MenuDropdown,
        Item: ({
          children,
          onClick,
        }: {
          children: ReactNode;
          onClick?: () => void;
        }) => <button type="button" onClick={onClick}>{children}</button>,
        Root: MenuRoot,
        Trigger: MenuTrigger,
      },
    },
    SideMenu: {
      Button: ({
        icon,
        label,
        ...props
      }: {
        icon: ReactNode;
        label: string;
      }) => (
        <button aria-label={label} {...props}>
          {icon}
        </button>
      ),
    },
  };

  return {
    AddBlockButton: () => null,
    BlockColorsItem: ({ children }: { children: ReactNode }) => children,
    SideMenu: ({ children }: { children: ReactNode }) => children,
    SideMenuController: ({ sideMenu: Component }: { sideMenu: React.ComponentType }) => (
      <Component />
    ),
    blockTypeSelectItems: () => [],
    useBlockNoteEditor: () => ({
      document: [hoveredBlock],
      focus: focusMock,
      getBlock: (blockId: string) =>
        hoveredBlock.id === blockId ? hoveredBlock : undefined,
      getSelection: () => undefined,
      getTextCursorPosition: () => ({ block: hoveredBlock }),
      isEditable: true,
      insertBlocks: insertBlocksMock,
      removeBlocks: removeBlocksMock,
      transact: transactMock,
    }),
    useComponentsContext: () => Components,
    useDictionary: () => ({
      side_menu: {
        drag_handle_label: 'Open block menu',
      },
    }),
    useEditorState: () => [hoveredBlock],
    useExtension: () => sideMenuExtension,
    useExtensionState: () => hoveredBlock,
  };
});

function createDocumentOperations(
  overrides: Partial<BlockNoteDocumentOperations> = {},
): BlockNoteDocumentOperations {
  return {
    archivingSubdocumentId: null,
    isArchiving: false,
    isDuplicating: false,
    onArchive: vi.fn(),
    onArchiveSubdocument: archiveSubdocumentMock,
    onCopyLink: vi.fn(),
    onDuplicate: vi.fn(),
    ...overrides,
  };
}

describe('EditorSideMenuController', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    archiveSubdocumentMock.mockClear();
    focusMock.mockClear();
    insertBlocksMock.mockReset();
    removeBlocksMock.mockReset();
    transactMock.mockClear();
    unfreezeMenuMock.mockClear();
    hoveredBlock.type = 'paragraph';
    hoveredBlock.props = {};
  });

  it('deletes the hovered block when Delete is pressed with the drag-handle menu open', () => {
    render(
      <EditorSideMenuController
        documentOperations={createDocumentOperations()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open block menu' }));
    expect(screen.getByRole('menu')).toBeVisible();

    fireEvent.keyDown(document, { key: 'Delete' });

    expect(removeBlocksMock).toHaveBeenCalledWith([
      {
        children: [],
        content: [],
        id: 'block-1',
        props: {},
        type: 'paragraph',
      },
    ]);
  });

  it('deletes the hovered block when Backspace is pressed with the drag-handle menu open', () => {
    render(
      <EditorSideMenuController
        documentOperations={createDocumentOperations()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open block menu' }));
    expect(screen.getByRole('menu')).toBeVisible();

    fireEvent.keyDown(document, { key: 'Backspace' });

    expect(removeBlocksMock).toHaveBeenCalledWith([
      {
        children: [],
        content: [],
        id: 'block-1',
        props: {},
        type: 'paragraph',
      },
    ]);
  });

  it('archives the hovered document block when Delete is pressed with the drag-handle menu open', () => {
    hoveredBlock.type = 'subdoc';
    hoveredBlock.props = { documentId: 'subdoc-1' };

    render(
      <EditorSideMenuController
        documentOperations={createDocumentOperations()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open block menu' }));
    expect(screen.getByRole('menu')).toBeVisible();
    expect(screen.getByText('Del')).toBeVisible();

    fireEvent.keyDown(document, { key: 'Delete' });

    expect(removeBlocksMock).not.toHaveBeenCalled();
    expect(archiveSubdocumentMock).toHaveBeenCalledWith(
      'subdoc-1',
      expect.any(Array),
    );
  });

  it('returns focus to the editor after archiving a collaborative document block', async () => {
    hoveredBlock.type = 'subdoc';
    hoveredBlock.props = { documentId: 'subdoc-1' };

    render(
      <EditorSideMenuController
        documentOperations={createDocumentOperations({
          isCollaborative: true,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open block menu' }));
    fireEvent.keyDown(document, { key: 'Delete' });

    await vi.waitFor(() => {
      expect(removeBlocksMock).toHaveBeenCalledWith([
        {
          children: [],
          content: [],
          id: 'block-1',
          props: { documentId: 'subdoc-1' },
          type: 'subdoc',
        },
      ]);
    });
    expect(transactMock).toHaveBeenCalledTimes(1);
    expect(focusMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the drag-handle menu open when document operations change', () => {
    const { rerender } = render(
      <EditorSideMenuController
        documentOperations={createDocumentOperations()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open block menu' }));
    expect(screen.getByRole('menu')).toBeVisible();

    rerender(
      <EditorSideMenuController
        documentOperations={createDocumentOperations({ isDuplicating: true })}
      />,
    );

    expect(screen.getByRole('menu')).toBeVisible();
  });

  it('inserts a duplicated document block after the hovered document block in collaborative mode', async () => {
    const duplicateDocument = vi.fn().mockResolvedValue({
      id: 'subdoc-copy-1',
      public_id: 'public-subdoc-copy-1',
      workspace_id: 'workspace-1',
      title: 'Duplicated subdoc',
      content: [{ id: 'content-block-1' }],
    });
    const onDuplicateSubdocumentUndoMetadata = vi.fn();
    hoveredBlock.type = 'subdoc';
    hoveredBlock.props = {
      documentId: 'subdoc-1',
      workspaceId: 'workspace-1',
    };

    render(
      <EditorSideMenuController
        documentOperations={createDocumentOperations({
          isCollaborative: true,
          onDuplicate: duplicateDocument,
          onDuplicateSubdocumentUndoMetadata,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open block menu' }));
    fireEvent.click(screen.getByText('Duplicate'));

    await vi.waitFor(() => {
      expect(insertBlocksMock).toHaveBeenCalledWith(
        [{
          type: 'subdoc',
          props: {
            documentId: 'subdoc-copy-1',
            publicId: 'public-subdoc-copy-1',
            workspaceId: 'workspace-1',
            publishedDocumentId: '',
            title: 'Duplicated subdoc',
            hasContent: true,
          },
        }],
        hoveredBlock,
        'after',
      );
    });
    expect(onDuplicateSubdocumentUndoMetadata).toHaveBeenCalledWith({
      anchorBlockId: 'block-1',
      duplicatedSubdocumentId: 'subdoc-copy-1',
      sourceSubdocumentId: 'subdoc-1',
    });
    expect(
      onDuplicateSubdocumentUndoMetadata.mock.invocationCallOrder[0],
    ).toBeLessThan(transactMock.mock.invocationCallOrder[0]);
    expect(focusMock).toHaveBeenCalledTimes(1);
  });

  it('duplicates the hovered document block from the keyboard shortcut', async () => {
    const duplicateDocument = vi.fn().mockResolvedValue({
      id: 'subdoc-copy-1',
      public_id: 'public-subdoc-copy-1',
      workspace_id: 'workspace-1',
      title: 'Duplicated subdoc',
      content: [],
    });
    hoveredBlock.type = 'subdoc';
    hoveredBlock.props = {
      documentId: 'subdoc-1',
      workspaceId: 'workspace-1',
    };

    render(
      <EditorSideMenuController
        documentOperations={createDocumentOperations({
          isCollaborative: true,
          onDuplicate: duplicateDocument,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open block menu' }));
    fireEvent.keyDown(document, { key: 'd', metaKey: true });

    await vi.waitFor(() => {
      expect(duplicateDocument).toHaveBeenCalledWith('subdoc-1');
      expect(insertBlocksMock).toHaveBeenCalledWith(
        [{
          type: 'subdoc',
          props: {
            documentId: 'subdoc-copy-1',
            publicId: 'public-subdoc-copy-1',
            workspaceId: 'workspace-1',
            publishedDocumentId: '',
            title: 'Duplicated subdoc',
            hasContent: false,
          },
        }],
        hoveredBlock,
        'after',
      );
    });
    expect(unfreezeMenuMock).toHaveBeenCalled();
  });
});
