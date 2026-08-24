import { io } from 'socket.io-client';
import { Awareness } from 'y-protocols/awareness';
import * as Yjs from 'yjs';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { DocumentSocketProvider } from './document-socket-provider';

type SocketHandler = (...args: unknown[]) => void;

class TestSocket {
  readonly emitted: Array<{
    event: string;
    payload: unknown;
  }> = [];

  private readonly handlers = new Map<string, SocketHandler>();

  connect() {
    this.handlers.get('connect')?.();
  }

  disconnect() {}

  emit(event: string, payload: unknown, callback?: SocketHandler) {
    this.emitted.push({ event, payload });

    if (event === 'collab:join') {
      const serverDocument = new Yjs.Doc();

      callback?.({
        ok: true,
        data: {
          canEdit: true,
          serverStateVector: Yjs.encodeStateVector(serverDocument),
          update: Yjs.encodeStateAsUpdate(serverDocument),
        },
      });
      return;
    }

    if (event === 'collab:update') {
      callback?.({
        ok: true,
        data: {
          sequence: 1,
          updatedAt: '2026-08-24T00:00:00.000Z',
        },
      });
    }
  }

  on(event: string, handler: SocketHandler) {
    this.handlers.set(event, handler);
  }
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('DocumentSocketProvider', () => {
  let socket: TestSocket;

  beforeEach(() => {
    socket = new TestSocket();
    vi.mocked(io).mockReturnValue(socket as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not send pre-existing local document state during initial join', () => {
    const document = new Yjs.Doc();
    document.getText('body').insert(0, 'Persisted local state');
    const provider = new DocumentSocketProvider(
      'document-1',
      document,
      new Awareness(document),
      {
        showPresence: false,
      },
    );

    provider.connect();

    expect(socket.emitted.map((entry) => entry.event)).toEqual(['collab:join']);

    provider.destroy();
  });

  it('sends local edits after initial join', () => {
    const document = new Yjs.Doc();
    const provider = new DocumentSocketProvider(
      'document-1',
      document,
      new Awareness(document),
      {
        showPresence: false,
      },
    );

    provider.connect();
    document.getText('body').insert(0, 'User edit');

    expect(socket.emitted.map((entry) => entry.event)).toEqual([
      'collab:join',
      'collab:update',
    ]);

    provider.destroy();
  });
});
