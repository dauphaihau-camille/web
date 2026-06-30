'use client';

import { useEffect, useRef, useState } from 'react';

const REVEAL_DELAY_MS = 180;

export function useDocumentChromeVisibility() {
  const [isChromeVisible, setIsChromeVisible] = useState(true);
  const hideStartedAtRef = useRef(0);
  const revealTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        window.clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  const hideChrome = () => {
    hideStartedAtRef.current = Date.now();

    if (revealTimeoutRef.current) {
      window.clearTimeout(revealTimeoutRef.current);
    }

    setIsChromeVisible(false);
  };

  const revealChrome = () => {
    if (revealTimeoutRef.current) {
      window.clearTimeout(revealTimeoutRef.current);
    }

    const elapsed = Date.now() - hideStartedAtRef.current;
    const delay = Math.max(REVEAL_DELAY_MS - elapsed, 0);

    revealTimeoutRef.current = window.setTimeout(() => {
      setIsChromeVisible(true);
    }, delay);
  };

  return {
    isChromeVisible,
    hideChrome,
    revealChrome,
  };
}
