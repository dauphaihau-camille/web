import { useEffect } from 'react';
import {
  act,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import { HTTPError } from 'ky';
import userEvent from '@testing-library/user-event';

const {
  createAiConversationSessionMock,
  getWorkspaceMock,
  getAiResponseLimitReachedDataMock,
  getAiResponseEntitlementMock,
  listAiChatTurnsMock,
  listAiConversationSessionsMock,
  streamAiChatTurnMock,
  toastMock,
} = vi.hoisted(() => ({
  createAiConversationSessionMock: vi.fn(),
  getWorkspaceMock: vi.fn(),
  getAiResponseLimitReachedDataMock: vi.fn((error: { data?: unknown }) => {
    const data = error.data;

    return typeof data === 'object'
      && data !== null
      && 'code' in data
      && data.code === 'ai_response_limit_reached'
      ? data
      : null;
  }),
  getAiResponseEntitlementMock: vi.fn(),
  listAiChatTurnsMock: vi.fn(),
  listAiConversationSessionsMock: vi.fn(),
  streamAiChatTurnMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: toastMock,
}));

vi.mock('@/domains/workspace', () => ({
  getWorkspace: getWorkspaceMock,
  workspaceKeys: {
    detail: (workspaceSlug: string) => ['workspace', workspaceSlug],
  },
}));

vi.mock('./ai-chat-panel.requests', () => ({
  createAiConversationSession: createAiConversationSessionMock,
  getAiResponseLimitReachedData: getAiResponseLimitReachedDataMock,
  getAiResponseEntitlement: getAiResponseEntitlementMock,
  listAiChatTurns: listAiChatTurnsMock,
  listAiConversationSessions: listAiConversationSessionsMock,
  streamAiChatTurn: streamAiChatTurnMock,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/w/acme',
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: vi.fn(),
  }),
}));

import { renderWithProviders } from '@shared/test/render';
import { WorkspaceShortcutsProvider } from '../workspace-shortcuts-provider';

import {
  useWorkspaceAiChatDocument,
  WorkspaceAiChatShell,
} from '../workspace-ai-chat-shell';

function CurrentDocumentRegistration({
  onAppendResponse,
}: {
  onAppendResponse?: (request: { content: string; responseBlockPayload: unknown[] }) => void | Promise<void>;
}) {
  const aiChatDocument = useWorkspaceAiChatDocument();

  useEffect(() => aiChatDocument?.registerCurrentDocument({
    id: 'doc-1',
    title: 'Account Health Review',
    onAppendResponse,
  }), [aiChatDocument, onAppendResponse]);

  return <main />;
}

function renderAiChat(children = <main />) {
  return renderWithProviders(
    <WorkspaceAiChatShell workspaceSlug="acme">
      {children}
    </WorkspaceAiChatShell>,
  );
}

function renderAiChatWithShortcuts(children = <main />) {
  return renderWithProviders(
    <WorkspaceShortcutsProvider>
      <WorkspaceAiChatShell workspaceSlug="acme">
        {children}
      </WorkspaceAiChatShell>
    </WorkspaceShortcutsProvider>,
  );
}

function createCompletedTurn(sessionId: string, message: string, assistantResponse: string) {
  return {
    id: 'turn-1',
    session_id: sessionId,
    user_message: message,
    assistant_response: assistantResponse,
    response_block_payload: [{
      id: 'ai-block-1',
      type: 'paragraph',
      content: [{ type: 'text', text: assistantResponse }],
    }],
    status: 'completed',
    attachments: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

beforeEach(() => {
  createAiConversationSessionMock.mockReset();
  getWorkspaceMock.mockReset();
  getAiResponseLimitReachedDataMock.mockClear();
  getAiResponseEntitlementMock.mockReset();
  listAiChatTurnsMock.mockReset();
  listAiConversationSessionsMock.mockReset();
  streamAiChatTurnMock.mockReset();
  toastMock.mockReset();
  getWorkspaceMock.mockResolvedValue({
    id: 'workspace-1',
    version: 1,
    name: 'Acme',
    slug: 'acme',
    current_user_role: 'member',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  });
  getAiResponseEntitlementMock.mockResolvedValue({
    workspace_id: 'workspace-1',
    plan: 'free',
    allowance: 20,
    used_responses: 4,
    reserved_responses: 0,
    remaining_responses: 16,
    limit_reached: false,
    upgrade_available: false,
  });
  listAiConversationSessionsMock.mockResolvedValue([
    {
      id: 'session-1',
      workspace_id: 'workspace-1',
      title: 'Research notes',
      group: 'Past week',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'session-launch',
      workspace_id: 'workspace-1',
      title: 'Launch readiness summary',
      group: 'Past week',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'session-untitled',
      workspace_id: 'workspace-1',
      title: null,
      group: 'Past week',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ]);
  listAiChatTurnsMock.mockResolvedValue({
    items: [],
    meta: { limit: 50, has_more: false },
  });
  createAiConversationSessionMock.mockResolvedValue({
    id: 'session-new',
    workspace_id: 'workspace-1',
    title: 'Untitled',
    group: 'Past week',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  });
  streamAiChatTurnMock.mockImplementation(async (_workspaceId, input, onEvent) => {
    onEvent({ type: 'block_start', block_id: 'ai-block-1', block_type: 'paragraph' });
    onEvent({
      type: 'text_delta',
      block_id: 'ai-block-1',
      content: [{ type: 'text', text: 'Server generated summary.' }],
    });
    onEvent({ type: 'block_end', block_id: 'ai-block-1' });
    onEvent({
      type: 'done',
      turn: createCompletedTurn(input.sessionId, input.message, 'Server generated summary.'),
    });
  });
});


describe('AiChatPanel', () => {
  it('toggles AI chat from the workspace shortcut', async () => {
    renderAiChatWithShortcuts();

    fireEvent.keyDown(window, {
      key: 'a',
      metaKey: true,
      shiftKey: true,
    });

    await waitFor(() => {
      expect(screen.getByRole('complementary', { name: 'AI chat' })).toBeInTheDocument();
    });

    fireEvent.keyDown(window, {
      key: 'a',
      metaKey: true,
      shiftKey: true,
    });

    await waitFor(() => {
      expect(screen.queryByRole('complementary', { name: 'AI chat' })).not.toBeInTheDocument();
    });
  });

  it('loads chat sessions from the AI API', async () => {
    const user = userEvent.setup();
    const { container } = renderAiChat();

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Selected chat session: New AI chat' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Selected chat session: New AI chat' }));
    expect(screen.getByRole('button', { name: 'Research notes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Untitled' })).toBeInTheDocument();
    expect(listAiConversationSessionsMock).toHaveBeenCalledWith('workspace-1', {
      q: undefined,
    });
    expect(container.firstElementChild).toHaveStyle({
      '--workspace-right-rail-width': '30rem',
      '--workspace-right-rail-reserved-width': 'var(--workspace-right-rail-width)',
    });
  });

  it('searches sessions through the AI API and displays matching sessions', async () => {
    const user = userEvent.setup();
    renderAiChat();

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Selected chat session: New AI chat' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Selected chat session: New AI chat' }));
    await user.type(screen.getByRole('textbox', { name: 'Search chat sessions' }), 'launch');

    await waitFor(() => {
      expect(listAiConversationSessionsMock).toHaveBeenCalledWith('workspace-1', {
        q: 'launch',
      });
    });
    expect(screen.getByRole('button', { name: 'Launch readiness summary' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Research notes' })).not.toBeInTheDocument();
  });

  it('loads persisted turns when switching between sessions', async () => {
    const user = userEvent.setup();
    listAiConversationSessionsMock.mockResolvedValue([
      {
        id: 'session-a',
        workspace_id: 'workspace-1',
        title: 'Session A',
        group: 'Past week',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'session-b',
        workspace_id: 'workspace-1',
        title: 'Session B',
        group: 'Past week',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    listAiChatTurnsMock.mockImplementation(async (_workspaceId, sessionId) => ({
      items: [{
        id: `turn-${sessionId}`,
        session_id: sessionId,
        user_message: `Question ${sessionId}`,
        assistant_response: `Answer ${sessionId}`,
        response_block_payload: [{
          id: `block-${sessionId}`,
          type: 'paragraph',
          content: [{ type: 'text', text: `Answer ${sessionId}` }],
        }],
        status: 'completed',
        attachments: [],
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:01:00.000Z',
      }],
      meta: { limit: 50, has_more: false },
    }));
    renderAiChat();

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Selected chat session: New AI chat' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Selected chat session: New AI chat' }));
    await user.click(screen.getByRole('button', { name: 'Session A' }));

    await waitFor(() => {
      expect(screen.getByText('Answer session-a')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Selected chat session: Session A' }));
    await user.click(screen.getByRole('button', { name: 'Session B' }));

    await waitFor(() => {
      expect(screen.getByText('Answer session-b')).toBeInTheDocument();
    });
    expect(screen.queryByText('Answer session-a')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Selected chat session: Session B' }));
    await user.click(screen.getByRole('button', { name: 'Session A' }));

    expect(screen.getByText('Answer session-a')).toBeInTheDocument();
    expect(listAiChatTurnsMock).toHaveBeenCalledWith('workspace-1', 'session-a');
    expect(listAiChatTurnsMock).toHaveBeenCalledWith('workspace-1', 'session-b');
  });

  it('loads older turns when scrolling to the top of a selected session', async () => {
    const user = userEvent.setup();
    listAiConversationSessionsMock.mockResolvedValue([
      {
        id: 'session-a',
        workspace_id: 'workspace-1',
        title: 'Session A',
        group: 'Past week',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    listAiChatTurnsMock.mockImplementation(async (_workspaceId, _sessionId, options) => {
      if (options?.cursor === 'older-cursor') {
        return {
          items: [{
            id: 'older-turn',
            session_id: 'session-a',
            user_message: 'Older question',
            assistant_response: 'Older answer',
            response_block_payload: [{
              id: 'older-block',
              type: 'paragraph',
              content: [{ type: 'text', text: 'Older answer' }],
            }],
            status: 'completed',
            attachments: [],
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          }],
          meta: { limit: 50, has_more: false },
        };
      }

      return {
        items: [{
          id: 'latest-turn',
          session_id: 'session-a',
          user_message: 'Latest question',
          assistant_response: 'Latest answer',
          response_block_payload: [{
            id: 'latest-block',
            type: 'paragraph',
            content: [{ type: 'text', text: 'Latest answer' }],
          }],
          status: 'completed',
          attachments: [],
          created_at: '2026-01-01T00:01:00.000Z',
          updated_at: '2026-01-01T00:01:00.000Z',
        }],
        meta: { limit: 50, has_more: true, next_cursor: 'older-cursor' },
      };
    });
    const { container } = renderAiChat();

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Selected chat session: New AI chat' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Selected chat session: New AI chat' }));
    await user.click(screen.getByRole('button', { name: 'Session A' }));

    await waitFor(() => {
      expect(screen.getByText('Latest answer')).toBeInTheDocument();
    });
    const viewport = container.querySelector('[data-slot="message-scroller-viewport"]');
    expect(viewport).not.toBeNull();
    fireEvent.scroll(viewport as Element, { target: { scrollTop: 0 } });

    await waitFor(() => {
      expect(screen.getByText('Older answer')).toBeInTheDocument();
    });
    expect(listAiChatTurnsMock).toHaveBeenCalledWith('workspace-1', 'session-a', {
      cursor: 'older-cursor',
      limit: 50,
    });
  });

  it('sends suggestions to the AI chat turn API', async () => {
    const user = userEvent.setup();
    renderAiChat();

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Summarize this page' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: 'Summarize this page' }));

    expect(screen.getByText('Summarize this page')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Server generated summary.')).toBeInTheDocument();
    });
    expect(streamAiChatTurnMock).toHaveBeenCalledWith('workspace-1', {
      sessionId: 'session-new',
      message: 'Summarize this page',
      documentIds: [],
    }, expect.any(Function));
  });

  it('shows a pending assistant response before the first stream delta', async () => {
    const user = userEvent.setup();
    let emitDelta: (() => void) | undefined;
    let finishStream: (() => void) | undefined;

    streamAiChatTurnMock.mockImplementation((_workspaceId, input, onEvent) => new Promise<void>((resolve) => {
      emitDelta = () => {
        onEvent({ type: 'block_start', block_id: 'ai-block-1', block_type: 'paragraph' });
        onEvent({
          type: 'text_delta',
          block_id: 'ai-block-1',
          content: [{ type: 'text', text: 'Server generated ' }],
        });
      };
      finishStream = () => {
        onEvent({ type: 'block_end', block_id: 'ai-block-1' });
        onEvent({
          type: 'done',
          turn: createCompletedTurn(input.sessionId, input.message, 'Server generated summary.'),
        });
        resolve();
      };
    }));
    const { container } = renderAiChat(<CurrentDocumentRegistration onAppendResponse={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Summarize this page' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: 'Summarize this page' }));

    expect(await screen.findByRole('status', { name: 'AI is thinking' })).toBeInTheDocument();
    expect(screen.getByText('Churning')).toBeInTheDocument();
    expect(screen.getByText('0.0s')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy response' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Append to this document' })).not.toBeInTheDocument();

    await act(async () => {
      emitDelta?.();
    });

    expect(screen.getByText('Server generated')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="stream-caret"]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy response' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Append to this document' })).not.toBeInTheDocument();

    await act(async () => {
      finishStream?.();
    });

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'AI is thinking' })).not.toBeInTheDocument();
    });
    expect(screen.getByText('Server generated summary.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy response' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Append to this document' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Append to this document' }).closest('[data-slot="assistant-message-actions"]'),
    ).toHaveClass('opacity-0');
  });

  it('renders structured assistant response blocks while streaming', async () => {
    const user = userEvent.setup();

    streamAiChatTurnMock.mockImplementation(async (_workspaceId, input, onEvent) => {
      onEvent({
        type: 'block_start',
        block_id: 'heading-1',
        block_type: 'heading',
        props: { level: 2 },
      });
      onEvent({
        type: 'text_delta',
        block_id: 'heading-1',
        content: [{ type: 'text', text: 'Objective', styles: { bold: true } }],
      });
      onEvent({ type: 'block_end', block_id: 'heading-1' });
      onEvent({ type: 'block_start', block_id: 'bullet-1', block_type: 'bulletListItem' });
      onEvent({
        type: 'text_delta',
        block_id: 'bullet-1',
        content: [
          { type: 'text', text: 'Next action:', styles: { bold: true } },
          { type: 'text', text: ' name the owner' },
        ],
      });
      onEvent({ type: 'block_end', block_id: 'bullet-1' });
      onEvent({
        type: 'done',
        turn: {
          ...createCompletedTurn(input.sessionId, input.message, 'Objective\\nNext action: name the owner'),
          response_block_payload: [
            {
              id: 'heading-1',
              type: 'heading',
              props: { level: 2 },
              content: [{ type: 'text', text: 'Objective', styles: { bold: true } }],
            },
            {
              id: 'bullet-1',
              type: 'bulletListItem',
              content: [
                { type: 'text', text: 'Next action:', styles: { bold: true } },
                { type: 'text', text: ' name the owner' },
              ],
            },
          ],
        },
      });
    });

    renderAiChat();

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Summarize this page' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: 'Summarize this page' }));

    expect(await screen.findByRole('heading', { name: 'Objective', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Next action:')).toHaveClass('font-semibold');
    expect(screen.getByText('name the owner')).toBeInTheDocument();
  });

  it('shows the workspace AI limit card and blocks sends when responses are exhausted', async () => {
    const user = userEvent.setup();
    getAiResponseEntitlementMock.mockResolvedValue({
      workspace_id: 'workspace-1',
      plan: 'free',
      allowance: 20,
      used_responses: 20,
      reserved_responses: 0,
      remaining_responses: 0,
      limit_reached: true,
      upgrade_available: false,
    });
    renderAiChat();

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByText('Workspace AI limit reached')).toBeInTheDocument();
    });
    await user.type(screen.getByRole('textbox', { name: 'Message AI' }), 'Try anyway');

    expect(screen.getByRole('button', { name: 'Upgrade Camille AI' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Dock AI limit notice' }));

    expect(screen.getByText('Workspace AI limit reached')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show AI limit details' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Upgrade Camille AI' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show AI limit details' }));

    expect(screen.getByRole('button', { name: 'Dock AI limit notice' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Upgrade Camille AI' })).toBeDisabled();
    expect(streamAiChatTurnMock).not.toHaveBeenCalled();
  });

  it('shows the workspace AI limit card when streaming is rejected by the backend limit', async () => {
    const user = userEvent.setup();
    const error = new HTTPError(
      new Response(null, { status: 403, statusText: 'Forbidden' }),
      new Request('http://localhost/v1/workspaces/workspace-1/ai/conversations/session-new/turns/stream'),
      {} as never,
    );
    error.data = {
      code: 'ai_response_limit_reached',
      message: 'Workspace AI trial responses are exhausted',
      remaining_responses: 0,
      upgrade_available: false,
    };
    streamAiChatTurnMock.mockRejectedValue(error);
    renderAiChat();

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Message AI' })).toBeEnabled();
    });
    await user.type(screen.getByRole('textbox', { name: 'Message AI' }), 'What are the risks?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(screen.getByText('Workspace AI limit reached')).toBeInTheDocument();
    });
    expect(toastMock).toHaveBeenCalledWith('Workspace AI trial responses are exhausted');
  });

  it('sends typed composer messages to the AI chat turn API', async () => {
    const user = userEvent.setup();
    renderAiChat();

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Message AI' })).toBeEnabled();
    });
    await user.type(screen.getByRole('textbox', { name: 'Message AI' }), 'What are the risks?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(streamAiChatTurnMock).toHaveBeenCalledWith('workspace-1', {
        sessionId: 'session-new',
        message: 'What are the risks?',
        documentIds: [],
      }, expect.any(Function));
    });
  });

  it('sends selected document badges as explicit attachments', async () => {
    const user = userEvent.setup();
    renderAiChat(<CurrentDocumentRegistration />);

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByText('Account Health Review')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Summarize this page' }));

    await waitFor(() => {
      expect(streamAiChatTurnMock).toHaveBeenCalledWith('workspace-1', expect.objectContaining({
        documentIds: ['doc-1'],
      }), expect.any(Function));
    });
    await waitFor(() => {
      expect(screen.getByText('Server generated summary.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Append to this document' })).toBeDisabled();
  });

  it('appends a completed API assistant response to the active editable document', async () => {
    const user = userEvent.setup();
    const appendResponse = vi.fn();
    renderAiChat(<CurrentDocumentRegistration onAppendResponse={appendResponse} />);

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Summarize this page' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: 'Summarize this page' }));
    await waitFor(() => {
      expect(screen.getByText('Server generated summary.')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Append to this document' }));

    expect(appendResponse).toHaveBeenCalledWith(expect.objectContaining({
      assistantMessageId: 'assistant-session-new-turn-1',
      content: 'Server generated summary.',
      responseBlockPayload: [{
        id: 'ai-block-1',
        type: 'paragraph',
        content: [{ type: 'text', text: 'Server generated summary.' }],
      }],
      conversationSessionId: 'session-new',
    }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Appended to document');
    });
  });

  it('resets to a local new chat without creating a server conversation', async () => {
    const user = userEvent.setup();
    listAiConversationSessionsMock.mockResolvedValue([
      {
        id: 'session-a',
        workspace_id: 'workspace-1',
        title: 'Session A',
        group: 'Past week',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    listAiChatTurnsMock.mockResolvedValue({
      items: [{
        id: 'turn-session-a',
        session_id: 'session-a',
        user_message: 'Question session-a',
        assistant_response: 'Answer session-a',
        response_block_payload: [{
          id: 'block-session-a',
          type: 'paragraph',
          content: [{ type: 'text', text: 'Answer session-a' }],
        }],
        status: 'completed',
        attachments: [],
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:01:00.000Z',
      }],
      meta: { limit: 50, has_more: false },
    });
    renderAiChat();

    await user.click(screen.getByRole('button', { name: 'Open AI chat' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Selected chat session: New AI chat' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Selected chat session: New AI chat' }));
    await user.click(screen.getByRole('button', { name: 'Session A' }));
    await waitFor(() => {
      expect(screen.getByText('Answer session-a')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Start new chat' }));

    expect(createAiConversationSessionMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Selected chat session: New AI chat' })).toBeInTheDocument();
    expect(screen.queryByText('Answer session-a')).not.toBeInTheDocument();
  });
});
