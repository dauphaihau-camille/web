import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  type Awareness,
} from 'y-protocols/awareness';
import * as Yjs from 'yjs';

import {
  BROADCAST_COLLABORATION_ORIGIN,
  SOCKET_COLLABORATION_ORIGIN,
} from './document-collaboration.constants';

type CollaborationChannel = Pick<
  BroadcastChannel,
  'addEventListener' | 'close' | 'postMessage' | 'removeEventListener'
>;

type BroadcastMessage =
  | { type: 'awareness'; update: Uint8Array }
  | { type: 'document'; update: Uint8Array };

type AwarenessChange = {
  added: number[];
  removed: number[];
  updated: number[];
};

export class DocumentBroadcastProvider {
  constructor(
    private readonly document: Yjs.Doc,
    private readonly awareness: Awareness,
    private readonly channel: CollaborationChannel,
  ) {
    document.on('update', this.handleDocumentUpdate);
    awareness.on('update', this.handleAwarenessUpdate);
    channel.addEventListener('message', this.handleMessage as EventListener);
  }

  destroy(): void {
    this.document.off('update', this.handleDocumentUpdate);
    this.awareness.off('update', this.handleAwarenessUpdate);
    this.channel.removeEventListener('message', this.handleMessage as EventListener);
    this.channel.close();
  }

  private readonly handleDocumentUpdate = (
    update: Uint8Array,
    origin: unknown,
  ) => {
    if (
      origin === BROADCAST_COLLABORATION_ORIGIN
      || origin === SOCKET_COLLABORATION_ORIGIN
    ) {
      return;
    }

    this.channel.postMessage({
      type: 'document',
      update,
    } satisfies BroadcastMessage);
  };

  private readonly handleAwarenessUpdate = (
    change: AwarenessChange,
    origin: unknown,
  ) => {
    if (
      origin === BROADCAST_COLLABORATION_ORIGIN
      || origin === SOCKET_COLLABORATION_ORIGIN
    ) {
      return;
    }

    const clients = [...change.added, ...change.updated, ...change.removed];

    if (clients.length === 0) {
      return;
    }

    this.channel.postMessage({
      type: 'awareness',
      update: encodeAwarenessUpdate(this.awareness, clients),
    } satisfies BroadcastMessage);
  };

  private readonly handleMessage = (event: MessageEvent<BroadcastMessage>) => {
    const message = event.data;

    if (message.type === 'document') {
      Yjs.applyUpdate(
        this.document,
        message.update,
        BROADCAST_COLLABORATION_ORIGIN,
      );
      return;
    }

    if (message.type === 'awareness') {
      applyAwarenessUpdate(
        this.awareness,
        message.update,
        BROADCAST_COLLABORATION_ORIGIN,
      );
    }
  };

}
