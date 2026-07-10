// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { BlockNoteDocumentOperations } from '../blocknote-editor.types';
import { EditorSideMenuController } from './side-menu-controller';

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

  const hoveredBlock = {
    id: 'block-1',
    type: 'paragraph',
    props: {},
    content: [],
    children: [],
  };
  const sideMenuExtension = {
    blockDragEnd: vi.fn(),
    blockDragStart: vi.fn(),
    freezeMenu: vi.fn(),
    setSelectedBlock: vi.fn(),
    unfreezeMenu: vi.fn(),
  };
  const Components = {
    Generic: {
      Menu: {
        Dropdown: MenuDropdown,
        Item: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
      getSelection: () => undefined,
      getTextCursorPosition: () => ({ block: hoveredBlock }),
      isEditable: true,
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
    isArchiving: false,
    isDuplicating: false,
    onArchive: vi.fn(),
    onCopyLink: vi.fn(),
    onDuplicate: vi.fn(),
    ...overrides,
  };
}

describe('EditorSideMenuController', () => {
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
});
