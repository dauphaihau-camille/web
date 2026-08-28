import { useEffect } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const {
  createAiConversationSessionMock,
  getWorkspaceMock,
  listAiChatTurnsMock,
  listAiConversationSessionsMock,
  streamAiChatTurnMock,
  toastMock,
} = vi.hoisted(() => ({
  createAiConversationSessionMock: vi.fn(),
  getWorkspaceMock: vi.fn(),
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
  listAiChatTurns: listAiChatTurnsMock,
  listAiConversationSessions: listAiConversationSessionsMock,
  streamAiChatTurn: streamAiChatTurnMock,
}));

import { renderWithProviders } from '@shared/test/render';

import {
  useWorkspaceAiChatDocument,
  WorkspaceAiChatShell,
} from '../workspace-ai-chat-shell';

function CurrentDocumentRegistration({
  onAppendResponse,
}: {
  onAppendResponse?: (request: { content: string }) => void | Promise<void>;
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

beforeEach(() => {
  createAiConversationSessionMock.mockReset();
  getWorkspaceMock.mockReset();
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
    onEvent({ type: 'started', session_id: input.sessionId });
    onEvent({ type: 'delta', text: 'Server ' });
    onEvent({ type: 'delta', text: 'generated summary.' });
    onEvent({
      type: 'done',
      turn: {
        id: 'turn-1',
        session_id: input.sessionId,
        user_message: input.message,
        assistant_response: 'Server generated summary.',
        status: 'completed',
        attachments: [],
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    });
  });
});

describe('AiChatPanel', () => {
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
