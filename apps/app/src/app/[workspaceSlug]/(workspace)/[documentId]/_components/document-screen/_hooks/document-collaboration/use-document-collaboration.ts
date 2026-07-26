'use client';

import { useEffect, useRef, useState } from 'react';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Awareness } from 'y-protocols/awareness';
import * as Yjs from 'yjs';

import { useCurrentUserQuery } from '@/domains/auth/hooks/use-current-user-query';

import { DocumentBroadcastProvider } from './document-broadcast-provider';
import {
  documentCollaborationChannelName,
  documentCollaborationStorageName,
} from './document-collaboration.constants';
import { DocumentSocketProvider } from './document-socket-provider';

type UseDocumentCollaborationOptions = {
  onDocumentUpdatedAtChange?: (updatedAt: string) => void;
  showPresence: boolean;
  workspaceId: string;
};

type AwarenessUser = {
  id?: string;
  name?: string;
};

type AwarenessState = {
  user?: AwarenessUser;
};

export function useDocumentCollaboration(
  documentId: string,
  options: UseDocumentCollaborationOptions,
) {
  const currentUserQuery = useCurrentUserQuery();
  const onDocumentUpdatedAtChangeRef = useRef(options.onDocumentUpdatedAtChange);

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
  const [activeMemberCount, setActiveMemberCount] = useState(0);
  const currentUserId = currentUserQuery.data?.id;

  useEffect(() => {
    onDocumentUpdatedAtChangeRef.current = options.onDocumentUpdatedAtChange;
  }, [options.onDocumentUpdatedAtChange]);

  useEffect(() => {
    setCanEdit(false);
    setError(null);
    setIsReady(false);

    if (!currentUserId) {
      return;
    }

    if (resources.destructionTimer !== null) {
      window.clearTimeout(resources.destructionTimer);
      resources.destructionTimer = null;
    }

    const collaborationNamespace = {
      documentId,
      userId: currentUserId,
      workspaceId: options.workspaceId,
    };

    const persistence = new IndexeddbPersistence(
      documentCollaborationStorageName(collaborationNamespace),
      resources.document,
    );

    const broadcastProvider = new DocumentBroadcastProvider(
      resources.document,
      resources.awareness,
      new BroadcastChannel(documentCollaborationChannelName(collaborationNamespace)),
    );

    const socketProvider = new DocumentSocketProvider(
      documentId,
      resources.document,
      resources.awareness,
      {
        onDocumentUpdatedAtChange: (updatedAt) => {
          onDocumentUpdatedAtChangeRef.current?.(updatedAt);
        },
        showPresence: options.showPresence,
      },
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
  }, [
    currentUserId,
    documentId,
    options.showPresence,
    options.workspaceId,
    resources,
  ]);

  useEffect(() => {
    const updateActiveMemberCount = () => {
      setActiveMemberCount(getActiveMemberCount(resources.awareness.getStates()));
    };

    updateActiveMemberCount();
    resources.awareness.on('update', updateActiveMemberCount);

    return () => {
      resources.awareness.off('update', updateActiveMemberCount);
    };
  }, [resources.awareness]);

  useEffect(() => {
    const currentUser = currentUserQuery.data;

    if (!currentUser || !options.showPresence) {
      resources.awareness.setLocalState(null);
      return;
    }

    const name = currentUser.displayName ?? currentUser.email;

    resources.awareness.setLocalStateField('user', {
      id: currentUser.id,
      name,
      color: collaborationColor(currentUser.id),
    });
  }, [currentUserQuery.data, options.showPresence, resources.awareness]);

  const currentUser = currentUserQuery.data;
  const userName = currentUser?.displayName ?? currentUser?.email ?? 'Collaborator';

  return {
    activeMemberCount,
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

function getActiveMemberCount(states: Map<number, unknown>): number {
  const memberKeys = new Set<string>();

  for (const state of states.values()) {
    const user = (state as AwarenessState | undefined)?.user;

    if (!user) {
      continue;
    }

    memberKeys.add(user.id ?? user.name ?? 'unknown');
  }

  return memberKeys.size;
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
