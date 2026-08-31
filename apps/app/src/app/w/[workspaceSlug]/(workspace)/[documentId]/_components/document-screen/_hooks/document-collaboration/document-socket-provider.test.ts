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
  readonly serverDocument = new Yjs.Doc();

  private readonly handlers = new Map<string, SocketHandler>();

  connect() {
    this.handlers.get('connect')?.();
  }

  disconnect() {}

  emit(event: string, payload: unknown, callback?: SocketHandler) {
    this.emitted.push({ event, payload });

    if (event === 'collab:join') {
      callback?.({
        ok: true,
        data: {
          canEdit: true,
          serverStateVector: Yjs.encodeStateVector(this.serverDocument),
          update: Yjs.encodeStateAsUpdate(this.serverDocument),
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

  it('sends pre-existing local document state after initial join', () => {
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

    expect(socket.emitted.map((entry) => entry.event)).toEqual([
      'collab:join',
      'collab:update',
    ]);
    const update = socket.emitted[1]?.payload as { update: Uint8Array };
    Yjs.applyUpdate(socket.serverDocument, update.update);
    expect(socket.serverDocument.getText('body').toString()).toBe('Persisted local state');

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
