import {
  act,
  fireEvent,
  screen,
} from '@testing-library/react';

import type { Document } from '@/domains/document';
import { renderWithProviders } from '@shared/test/render';

import { DocumentScreen } from './document-screen';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('@shared/components/editor/create-blocknote-editor-loader', () => ({
  createBlockNoteEditorLoader: () =>
    function MockBlockNoteEditorLoader({
      suppressHoverControls,
    }: {
      suppressHoverControls?: boolean;
    }) {
      return (
        <button type="button" data-testid="editor" data-suppress-hover-controls={String(Boolean(suppressHoverControls))}>
          Editor
        </button>
      );
    },
}));

vi.mock('./_hooks/document-collaboration/use-document-collaboration', () => ({
  useDocumentCollaboration: () => ({
    canEdit: true,
    collaboration: {
      fragment: {},
      provider: {
        awareness: {},
      },
      user: {
        name: 'Owner',
        color: 'hsl(10 68% 48%)',
      },
    },
    document: {},
    error: null,
    isReady: true,
  }),
}));

vi.mock('./_hooks/use-document-editor-actions', () => ({
  useDocumentEditorActions: () => ({
    archiveSubdocument: vi.fn(),
    archivingSubdocumentId: null,
    createSubdocument: vi.fn(),
  }),
}));

vi.mock('./_hooks/use-document-title', () => ({
  useDocumentTitle: () => ({
    displayTitle: 'Quarterly plan',
    handleTitleBlur: vi.fn(),
    handleTitleChange: vi.fn(),
    savedTitle: 'Quarterly plan',
    title: 'Quarterly plan',
  }),
}));

vi.mock('./document-toolbar/use-document-toolbar', () => ({
  useDocumentToolbar: () => ({
    archiveCurrentDocument: vi.fn(),
    copyLink: vi.fn(),
    copyPublishedLink: vi.fn(),
    duplicateDocument: vi.fn(),
    favoriteStatus: {
      is_favorite: false,
    },
    isArchived: false,
    isArchiving: false,
    isDuplicating: false,
    isFavoriting: false,
    isPermanentlyDeleting: false,
    isPublishing: false,
    isRestoring: false,
    isUnpublishing: false,
    permanentlyDeleteCurrentDocument: vi.fn(),
    publishCurrentDocument: vi.fn(),
    publishStatus: {
      document_id: 'doc-1',
      published_document_id: undefined,
      public_path: undefined,
    },
    restoreCurrentDocument: vi.fn(),
    toggleFavorite: vi.fn(),
    unpublishCurrentDocument: vi.fn(),
  }),
}));

vi.mock('./document-toolbar/document-toolbar', () => ({
  DocumentToolbar: ({
    isVisible = true,
    onShareOpenChange,
  }: {
    isVisible?: boolean;
    onShareOpenChange?: (open: boolean) => void;
  }) => (
    <div
      data-testid="document-toolbar"
      className={isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}
    >
      <button type="button" onClick={() => onShareOpenChange?.(true)}>
        Open share
      </button>
      <button type="button" onClick={() => onShareOpenChange?.(false)}>
        Close share
      </button>
    </div>
  ),
}));

const documentFixture: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 1,
  workspace_id: 'workspace-1',
  owner_user_id: 'user-1',
  owner_user: {
    id: 'user-1',
    email: 'owner@example.com',
    display_name: 'Owner',
  },
  teamspace_id: undefined,
  parent_document_id: undefined,
  title: 'Quarterly plan',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 10,
  archived_at: undefined,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  access: {
    scope: 'private',
    permission: 'manage',
    can_view: true,
    can_edit: true,
    can_manage: true,
  },
  collaboration: {
    enabled: true,
    mode: 'edit',
    show_presence: false,
  },
};

function renderDocumentScreen() {
  return renderWithProviders(
    <DocumentScreen
      document={documentFixture}
      workspaceSlug="acme"
    />,
  );
}

function expectDocumentChromeVisible() {
  expect(screen.getByLabelText('breadcrumb')).toHaveClass('opacity-100');
  expect(screen.getByTestId('document-toolbar')).toHaveClass('opacity-100');
}

function expectDocumentChromeHidden() {
  expect(screen.getByLabelText('breadcrumb')).toHaveClass('opacity-0');
  expect(screen.getByTestId('document-toolbar')).toHaveClass('opacity-0');
}

async function advanceRevealDelay() {
  await act(async () => {
    vi.advanceTimersByTime(180);
  });
}

describe('DocumentScreen chrome visibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps chrome visible on content focus, hides it while typing, and reveals it on pointer movement', async () => {
    const { container } = renderDocumentScreen();
    const titleInput = screen.getByRole('textbox');

    expectDocumentChromeVisible();

    fireEvent.focus(titleInput);

    expectDocumentChromeVisible();

    fireEvent.keyDown(titleInput, { key: 'A' });

    expectDocumentChromeHidden();

    fireEvent.pointerMove(container.firstElementChild as Element);
    await advanceRevealDelay();

    expectDocumentChromeVisible();

    fireEvent.keyDown(titleInput, { key: 'A' });

    expectDocumentChromeHidden();
  });

  it('keeps editor hover controls suppressed and chrome hidden while share is open', async () => {
    const { container } = renderDocumentScreen();

    fireEvent.click(screen.getByRole('button', { name: 'Open share' }));

    expect(screen.getByTestId('editor')).toHaveAttribute(
      'data-suppress-hover-controls',
      'true',
    );

    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'A' });
    fireEvent.pointerMove(container.firstElementChild as Element);
    await advanceRevealDelay();

    expectDocumentChromeHidden();

    fireEvent.click(screen.getByRole('button', { name: 'Close share' }));

    expect(screen.getByTestId('editor')).toHaveAttribute(
      'data-suppress-hover-controls',
      'false',
    );
  });
});
