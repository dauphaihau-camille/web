'use client';

import { useCallback, useRef } from 'react';

type LatestWinsSaveQueueOptions<TValue, TMeta extends object> = {
  initialMeta: TMeta;
  onFlush: (value: TValue, meta: TMeta) => Promise<void>;
};

export function useLatestWinsSaveQueue<TValue, TMeta extends object>({
  initialMeta,
  onFlush,
}: LatestWinsSaveQueueOptions<TValue, TMeta>) {
  const onFlushRef = useRef(onFlush);
  const queueStateRef = useRef<{
    inFlight: boolean;
    idleResolvers: Array<() => void>;
    pendingValue: TValue | null;
    pendingMeta: TMeta;
  }>({
    inFlight: false,
    idleResolvers: [],
    pendingValue: null,
    pendingMeta: initialMeta,
  });

  onFlushRef.current = onFlush;

  const flush = useCallback(async () => {
    const state = queueStateRef.current;

    if (state.inFlight) {
      return;
    }

    state.inFlight = true;

    try {
      while (state.pendingValue !== null) {
        const nextValue = state.pendingValue;
        const nextMeta = state.pendingMeta;

        state.pendingValue = null;
        state.pendingMeta = initialMeta;

        await onFlushRef.current(nextValue, nextMeta);
      }
    }
    finally {
      state.inFlight = false;
      const idleResolvers = [...state.idleResolvers];
      state.idleResolvers = [];
      idleResolvers.forEach((resolve) => resolve());
    }
  }, [initialMeta]);

  const enqueue = useCallback((value: TValue, meta?: Partial<TMeta>) => {
    const state = queueStateRef.current;

    state.pendingValue = value;
    state.pendingMeta = {
      ...state.pendingMeta,
      ...meta,
    };

    return flush();
  }, [flush]);

  const awaitIdle = useCallback(async () => {
    const state = queueStateRef.current;

    if (!state.inFlight) {
      return;
    }

    await new Promise<void>((resolve) => {
      state.idleResolvers.push(resolve);
    });
  }, []);

  return {
    awaitIdle,
    enqueue,
  };
}
