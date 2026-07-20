'use client';

import { useEffect, useState } from 'react';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Awareness } from 'y-protocols/awareness';
import * as Yjs from 'yjs';

import { useCurrentUserQuery } from '@/domains/auth/hooks/use-current-user-query';

import { DocumentBroadcastProvider } from './document-broadcast-provider';
import { DocumentSocketProvider } from './document-socket-provider';

export function useDocumentCollaboration(documentId: string) {
  const currentUserQuery = useCurrentUserQuery();

  const [resources] = useState(() => {
    const document = new Yjs.Doc();

    return {
      awareness: new Awareness(document),
      destructionTimer: null as number | null,
      document,
      fragment: document.getXmlFragment('prosemirror'),
    };
  });

  const [canEdit, setCanEdit] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (resources.destructionTimer !== null) {
      window.clearTimeout(resources.destructionTimer);
      resources.destructionTimer = null;
    }

    const persistence = new IndexeddbPersistence(
      `camille:document:${documentId}`,
      resources.document,
    );

    const broadcastProvider = new DocumentBroadcastProvider(
      resources.document,
      resources.awareness,
      new BroadcastChannel(`camille:document:${documentId}`),
    );

    const socketProvider = new DocumentSocketProvider(
      documentId,
      resources.document,
      resources.awareness,
    );

    let cancelled = false;
    let connectTimer: number | null = null;

    const unsubscribe = socketProvider.subscribe((status) => {
      if (cancelled) {
        return;
      }

      setCanEdit(status.canEdit);
      setError(status.error);

      if (status.synced) {
        setIsReady(true);
      }
    });

    void persistence.whenSynced.then(() => {
      if (
        !cancelled
        && !navigator.onLine
        && hasPersistedState(resources.document)
      ) {
        setIsReady(true);
      }
    });

    // Delay the initial connect by one tick so React Strict Mode's throwaway
    // mount in development doesn't open and immediately close a websocket.
    connectTimer = window.setTimeout(() => {
      if (!cancelled) {
        socketProvider.connect();
      }
    }, 0);

    return () => {
      cancelled = true;
      if (connectTimer !== null) {
        window.clearTimeout(connectTimer);
      }
      unsubscribe();
      socketProvider.destroy();
      broadcastProvider.destroy();
      void persistence.destroy();

      resources.destructionTimer = window.setTimeout(() => {
        resources.awareness.destroy();
        resources.document.destroy();
      });
    };
  }, [documentId, resources]);

  useEffect(() => {
    const currentUser = currentUserQuery.data;

    if (!currentUser) {
      return;
    }

    const name = currentUser.displayName ?? currentUser.email;

    resources.awareness.setLocalStateField('user', {
      name,
      color: collaborationColor(currentUser.id),
    });
  }, [currentUserQuery.data, resources.awareness]);

  const currentUser = currentUserQuery.data;
  const userName = currentUser?.displayName ?? currentUser?.email ?? 'Collaborator';

  return {
    canEdit,
    collaboration: {
      fragment: resources.fragment,
      provider: {
        awareness: resources.awareness,
      },
      user: {
        name: userName,
        color: collaborationColor(currentUser?.id ?? documentId),
      },
    },
    document: resources.document,
    error,
    isReady,
  };
}

function collaborationColor(value: string): string {
  let hash = 0;

  for (const character of value) {
    hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  }

  return `hsl(${Math.abs(hash) % 360} 68% 48%)`;
}

function hasPersistedState(document: Yjs.Doc): boolean {
  return Yjs.encodeStateVector(document).byteLength > 1;
}
