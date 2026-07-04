'use client';

import { useEffect, useState } from 'react';

import { formatRelativeTime } from './header-actions.utils';

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const text = isMounted ? formatRelativeTime(value) : fallback;

  return <span>{prefix ? `${prefix} ${text}` : text}</span>;
}
