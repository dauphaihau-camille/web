import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  type Awareness,
} from 'y-protocols/awareness';
import * as Yjs from 'yjs';

import { publicEnv } from '@shared/lib/public-env';

import type { CollaborationBinary } from './document-collaboration-binary';
import { toUint8Array } from './document-collaboration-binary';
import {
  BROADCAST_COLLABORATION_ORIGIN,
  SOCKET_COLLABORATION_ORIGIN,
} from './document-collaboration.constants';

// Yjs encodes an empty diff as [0, 0].
const EMPTY_YJS_UPDATE_LENGTH = 2;

type CollaborationResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type ServerToClientEvents = {
  'collab:awareness': (payload: CollaborationUpdatePayload) => void;
  'collab:error': (response: CollaborationResponse<never>) => void;
  'collab:update': (payload: CollaborationUpdatePayload) => void;
};

type ClientToServerEvents = {
  'collab:awareness': (payload: CollaborationUpdatePayload) => void;
  'collab:join': (
    payload: { documentId: string; stateVector: Uint8Array },
    callback: (response: CollaborationResponse<JoinResponse>) => void,
  ) => void;
  'collab:update': (
    payload: CollaborationUpdatePayload,
    callback?: (response: CollaborationResponse<{ sequence: number }>) => void,
  ) => void;
};

type CollaborationUpdatePayload = {
  documentId: string;
  update: CollaborationBinary;
};

type JoinResponse = {
  canEdit: boolean;
  serverStateVector: CollaborationBinary;
  update: CollaborationBinary;
};

type AwarenessChange = {
  added: number[];
  removed: number[];
  updated: number[];
};

type ProviderStatus = {
  canEdit: boolean;
  error: string | null;
  synced: boolean;
};

function hasMeaningfulYjsUpdate(update: Uint8Array): boolean {
  return update.byteLength > EMPTY_YJS_UPDATE_LENGTH;
}

export class DocumentSocketProvider {
  readonly awareness: Awareness;

  private canEdit = false;
  private error: string | null = null;
  private joined = false;
  private readonly listeners = new Set<(status: ProviderStatus) => void>();
  private readonly socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private synced = false;

  constructor(
    private readonly documentId: string,
    private readonly document: Yjs.Doc,
    awareness: Awareness,
  ) {
    this.awareness = awareness;

    const socketOrigin = publicEnv.apiOrigin ??
      (typeof window === 'undefined' ? '' : window.location.origin);

    this.socket = io(`${socketOrigin}/collaboration`, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
    });

    document.on('update', this.handleDocumentUpdate);
    awareness.on('update', this.handleAwarenessUpdate);

    this.socket.on('connect', () => this.synchronize());

    this.socket.on('disconnect', () => {
      this.joined = false;
      this.synced = false;
      this.emitStatus();
    });

    this.socket.on('connect_error', (error) => {
      this.error = error.message;
      this.emitStatus();
    });

    this.socket.on('collab:error', (response) => {
      this.error = response.ok ? null : response.error.message;
      this.emitStatus();
    });

    this.socket.on('collab:update', (payload) => {
      if (payload.documentId !== this.documentId) {
        return;
      }

      Yjs.applyUpdate(
        this.document,
        toUint8Array(payload.update),
        SOCKET_COLLABORATION_ORIGIN,
      );
    });

    this.socket.on('collab:awareness', (payload) => {
      if (payload.documentId !== this.documentId) {
        return;
      }

      applyAwarenessUpdate(
        this.awareness,
        toUint8Array(payload.update),
        SOCKET_COLLABORATION_ORIGIN,
      );
    });
  }

  connect(): void {
    this.socket.connect();
  }

  destroy(): void {
    this.document.off('update', this.handleDocumentUpdate);
    this.awareness.off('update', this.handleAwarenessUpdate);
    this.listeners.clear();
    this.socket.disconnect();
  }

  subscribe(listener: (status: ProviderStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());

    return () => this.listeners.delete(listener);
  }

  private readonly handleDocumentUpdate = (
    update: Uint8Array,
    origin: unknown,
  ) => {
    if (
      !this.joined
      || !this.canEdit
      || origin === SOCKET_COLLABORATION_ORIGIN
      || origin === BROADCAST_COLLABORATION_ORIGIN
    ) {
      return;
    }

    this.sendUpdate(update);
  };

  private readonly handleAwarenessUpdate = (
    change: AwarenessChange,
    origin: unknown,
  ) => {
    if (
      !this.joined
      || origin === SOCKET_COLLABORATION_ORIGIN
      || origin === BROADCAST_COLLABORATION_ORIGIN
    ) {
      return;
    }

    const clients = [...change.added, ...change.updated, ...change.removed];

    if (clients.length === 0) {
      return;
    }

    this.socket.emit('collab:awareness', {
      documentId: this.documentId,
      update: encodeAwarenessUpdate(this.awareness, clients),
    });
  };

  private synchronize(): void {
    this.socket.emit('collab:join', {
      documentId: this.documentId,
      stateVector: Yjs.encodeStateVector(this.document),
    }, (response) => {
      if (!response.ok) {
        this.error = response.error.message;
        this.emitStatus();
        return;
      }

      const serverStateVector = toUint8Array(response.data.serverStateVector);
      const localUpdate = Yjs.encodeStateAsUpdate(this.document, serverStateVector);

      Yjs.applyUpdate(
        this.document,
        toUint8Array(response.data.update),
        SOCKET_COLLABORATION_ORIGIN,
      );

      this.canEdit = response.data.canEdit;
      this.error = null;
      this.joined = true;
      this.synced = true;
      this.emitStatus();

      if (this.awareness.getLocalState()) {
        this.socket.emit('collab:awareness', {
          documentId: this.documentId,
          update: encodeAwarenessUpdate(this.awareness, [this.awareness.clientID]),
        });
      }

      if (hasMeaningfulYjsUpdate(localUpdate) && this.canEdit) {
        this.sendUpdate(localUpdate);
      }
    });
  }

  private sendUpdate(update: Uint8Array): void {
    this.socket.emit('collab:update', {
      documentId: this.documentId,
      update,
    }, (response) => {
      if (!response.ok) {
        this.error = response.error.message;
        this.emitStatus();
      }
    });
  }

  private emitStatus(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  private getStatus(): ProviderStatus {
    return {
      canEdit: this.canEdit,
      error: this.error,
      synced: this.synced,
    };
  }
}
