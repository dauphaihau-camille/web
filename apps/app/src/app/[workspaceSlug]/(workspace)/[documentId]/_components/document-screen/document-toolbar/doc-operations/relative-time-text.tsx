'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import { formatRelativeTime } from '../document-toolbar.utils';

type RelativeTimeTextProps = {
  fallback: string;
  prefix?: string;
  value: string;
};

export function RelativeTimeText({
  fallback,
  prefix,
  value,
}: RelativeTimeTextProps) {
  const [, setTick] = useState(0);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Refresh while mounted so relative timestamps age from "just now" to minutes/hours.
  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTick((tick) => tick + 1);
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [isMounted]);

  const text = isMounted ? formatRelativeTime(value) : fallback;

  return <span>{prefix ? `${prefix} ${text}` : text}</span>;
}
