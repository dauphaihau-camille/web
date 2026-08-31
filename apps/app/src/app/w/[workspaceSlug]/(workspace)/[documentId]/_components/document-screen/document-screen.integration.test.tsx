import {
  act,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Yjs from 'yjs';

import type { Document } from '@/domains/document';
import { renderWithProviders } from '@shared/test/render';

import { DocumentScreen } from './document-screen';
import { WorkspaceAiChatShell } from '../../../../_components/workspace-ai-chat-shell';

const collaborationMock = vi.hoisted(() => ({
  document: undefined as Yjs.Doc | undefined,
  onDocumentUpdatedAtChange: undefined as
    | ((updatedAt: string) => void)
    | undefined,
}));

const editorMock = vi.hoisted(() => ({
  appendedBlocks: [] as unknown[][],
}));

const aiChatMock = vi.hoisted(() => ({
  getWorkspace: vi.fn(),
  listAiConversationSessions: vi.fn(),
  listAiChatTurns: vi.fn(),
  streamAiChatTurn: vi.fn(),
}));

vi.mock('@/domains/workspace', () => ({
  getWorkspace: aiChatMock.getWorkspace,
  workspaceKeys: {
    detail: (workspaceSlug: string) => ['workspace', workspaceSlug],
  },
}));

vi.mock('../../../../_components/ai-chat-panel/ai-chat-panel.requests', () => ({
  createAiConversationSession: vi.fn(),
  listAiChatTurns: aiChatMock.listAiChatTurns,
  listAiConversationSessions: aiChatMock.listAiConversationSessions,
  streamAiChatTurn: aiChatMock.streamAiChatTurn,
}));

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
      appendBlocksRequest,
      onCollaborativeContentChangeAction,
      suppressHoverControls,
    }: {
      appendBlocksRequest?: {
        blocks: unknown[];
        onComplete: (result: { ok: boolean }) => void;
      };
      onCollaborativeContentChangeAction?: () => void;
      suppressHoverControls?: boolean;
    }) {
      if (appendBlocksRequest) {
        editorMock.appendedBlocks.push(appendBlocksRequest.blocks);
        appendBlocksRequest.onComplete({ ok: true });
      }
      return (
        <button
          type="button"
          data-testid="editor"
          data-suppress-hover-controls={String(Boolean(suppressHoverControls))}
          onClick={onCollaborativeContentChangeAction}
        >
          Editor
        </button>
      );
    },
}));

vi.mock('./_hooks/use-document-collaboration/use-document-collaboration', () => ({
  useDocumentCollaboration: (
    _documentId: string,
    options: {
      onDocumentUpdatedAtChange?: (updatedAt: string) => void;
    },
  ) => {
    collaborationMock.onDocumentUpdatedAtChange = options.onDocumentUpdatedAtChange;
    collaborationMock.document ??= new Yjs.Doc();

    return {
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
      document: collaborationMock.document,
      error: null,
      isReady: true,
    };
  },
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
    updatedAt,
  }: {
    isVisible?: boolean;
    onShareOpenChange?: (open: boolean) => void;
    updatedAt: string;
  }) => (
    <div
      data-testid="document-toolbar"
      className={isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}
    >
      <span data-testid="toolbar-updated-at">{updatedAt}</span>
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

function renderDocumentScreen({ withAiShell = false } = {}) {
  const documentScreen = (
    <DocumentScreen
      document={documentFixture}
      workspaceSlug="acme"
    />
  );

  return renderWithProviders(
    withAiShell
      ? <WorkspaceAiChatShell workspaceSlug="acme">{documentScreen}</WorkspaceAiChatShell>
      : documentScreen,
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

describe('DocumentScreen AI append action', () => {
  beforeEach(() => {
    editorMock.appendedBlocks = [];
    collaborationMock.document = new Yjs.Doc();
    collaborationMock.onDocumentUpdatedAtChange = undefined;
    aiChatMock.getWorkspace.mockReset();
    aiChatMock.listAiConversationSessions.mockReset();
    aiChatMock.listAiChatTurns.mockReset();
    aiChatMock.streamAiChatTurn.mockReset();
    aiChatMock.getWorkspace.mockResolvedValue({
      id: 'workspace-1',
      version: 1,
      name: 'Acme',
      slug: 'acme',
      current_user_role: 'member',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });
    aiChatMock.listAiConversationSessions.mockResolvedValue([
      {
        id: 'untitled',
        workspace_id: 'workspace-1',
        title: 'Untitled',
        group: 'Past week',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    aiChatMock.listAiChatTurns.mockResolvedValue({
      items: [],
      meta: { limit: 50, has_more: false },
    });
    aiChatMock.streamAiChatTurn.mockImplementation(async (_workspaceId, input, onEvent) => {
      onEvent({
        type: 'block_start',
        block_id: 'ai-block-1',
        block_type: 'heading',
        props: { level: 1 },
      });
      onEvent({
        type: 'text_delta',
        block_id: 'ai-block-1',
        content: [{ type: 'text', text: 'My AI Notes Summary' }],
      });
      onEvent({ type: 'block_end', block_id: 'ai-block-1' });
      onEvent({
        type: 'block_start',
        block_id: 'ai-block-2',
        block_type: 'heading',
        props: { level: 2 },
      });
      onEvent({
        type: 'text_delta',
        block_id: 'ai-block-2',
        content: [{ type: 'text', text: 'Objective' }],
      });
      onEvent({ type: 'block_end', block_id: 'ai-block-2' });
      onEvent({
        type: 'done',
        turn: {
          id: 'mock-assistant-streaming-scroll',
          session_id: input.sessionId,
          user_message: input.message,
          assistant_response: 'My AI Notes Summary\nObjective\nFirst point\nFirst detail\nSecond point\n> Quote me',
          response_block_payload: [
            {
              id: 'ai-block-1',
              type: 'heading',
              props: { level: 1 },
              content: [{ type: 'text', text: 'My AI Notes Summary' }],
            },
            {
              id: 'ai-block-2',
              type: 'heading',
              props: { level: 2 },
              content: [{ type: 'text', text: 'Objective' }],
            },
            {
              id: 'ai-block-3',
              type: 'numberedListItem',
              content: [{ type: 'text', text: 'First point', styles: { bold: true } }],
            },
            {
              id: 'ai-block-4',
              type: 'paragraph',
              content: [{ type: 'text', text: 'First detail' }],
            },
            {
              id: 'ai-block-5',
              type: 'numberedListItem',
              content: [{ type: 'text', text: 'Second point', styles: { bold: true } }],
            },
            {
              id: 'ai-block-6',
              type: 'paragraph',
              content: [{ type: 'text', text: '> Quote me' }],
            },
          ],
          status: 'completed',
          attachments: [],
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      });
    });
  });

  it('appends a completed assistant response through the active document editor', async () => {
    const user = userEvent.setup();

    renderDocumentScreen({ withAiShell: true });

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Selected chat session: New AI chat' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Selected chat session: New AI chat' }));
    await user.click(screen.getByRole('button', { name: 'Untitled' }));
    await user.click(screen.getByRole('button', { name: 'Summarize this page' }));
    await waitFor(() => {
      expect(screen.getByText('My AI Notes Summary')).toBeInTheDocument();
      expect(screen.getByText('Objective')).toBeInTheDocument();
    });
    await user.click(screen.getAllByRole('button', { name: 'Append to this document' })[0]);

    await waitFor(() => {
      expect(editorMock.appendedBlocks[0]).toEqual([
        expect.objectContaining({
          type: 'heading',
          props: { level: 2 },
          content: [{ type: 'text', text: 'My AI Notes Summary' }],
        }),
        expect.objectContaining({
          type: 'heading',
          props: { level: 3 },
          content: [{ type: 'text', text: 'Objective' }],
        }),
        expect.objectContaining({
          type: 'numberedListItem',
          content: [{ type: 'text', text: 'First point', styles: { bold: true } }],
          children: [
            expect.objectContaining({
              type: 'paragraph',
              content: [{ type: 'text', text: 'First detail' }],
            }),
          ],
        }),
        expect.objectContaining({
          type: 'numberedListItem',
          content: [{ type: 'text', text: 'Second point', styles: { bold: true } }],
        }),
        expect.objectContaining({
          type: 'quote',
          content: [{ type: 'text', text: 'Quote me' }],
        }),
      ]);
      expect(editorMock.appendedBlocks[0]?.[0]).not.toHaveProperty('id');
      expect(editorMock.appendedBlocks[0]?.[1]).not.toHaveProperty('id');
    });
    expect(screen.getByRole('complementary', { name: 'AI chat' })).toBeInTheDocument();
    expect(collaborationMock.document?.getArray('ai_assisted_edit_metadata').toArray()).toEqual([
      expect.objectContaining({
        actionType: 'append',
        assistantMessageId: 'assistant-untitled-mock-assistant-streaming-scroll',
        conversationSessionId: 'untitled',
        actorName: 'Owner',
      }),
    ]);
  });
});

describe('DocumentScreen chrome visibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    collaborationMock.document = new Yjs.Doc();
    collaborationMock.onDocumentUpdatedAtChange = undefined;
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

    fireEvent.change(titleInput, { target: { value: 'Quarterly plan A' } });

    expectDocumentChromeHidden();

    fireEvent.pointerMove(container.firstElementChild as Element);
    await advanceRevealDelay();

    expectDocumentChromeVisible();

    fireEvent.change(titleInput, { target: { value: 'Quarterly plan AB' } });

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
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Quarterly plan A' },
    });
    fireEvent.pointerMove(container.firstElementChild as Element);
    await advanceRevealDelay();

    expectDocumentChromeHidden();

    fireEvent.click(screen.getByRole('button', { name: 'Close share' }));

    expect(screen.getByTestId('editor')).toHaveAttribute(
      'data-suppress-hover-controls',
      'false',
    );
  });

  it('updates the toolbar timestamp when collaboration save is acknowledged', () => {
    renderDocumentScreen();

    expect(screen.getByTestId('toolbar-updated-at')).toHaveTextContent(
      '2026-01-01T00:00:00.000Z',
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Quarterly plan A' },
    });

    act(() => {
      collaborationMock.onDocumentUpdatedAtChange?.('2026-01-02T00:00:00.000Z');
    });

    expect(screen.getByTestId('toolbar-updated-at')).toHaveTextContent(
      '2026-01-02T00:00:00.000Z',
    );
  });
});
