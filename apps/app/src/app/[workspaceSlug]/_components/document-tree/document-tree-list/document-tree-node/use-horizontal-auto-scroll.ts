'use client';

import * as React from 'react';

type UseHorizontalAutoScrollOptions = {
  pixelsPerSecond?: number;
};

export function useHorizontalAutoScroll({
  pixelsPerSecond = 80,
}: UseHorizontalAutoScrollOptions = {}) {
  const animationFrameRef = React.useRef<number | null>(null);

  const cancelScroll = React.useCallback(() => {
    if (animationFrameRef.current === null) {
      return;
    }

    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }, []);

  const scrollTo = React.useCallback(
    (element: HTMLElement, targetLeft: number) => {
      cancelScroll();

      const startLeft = element.scrollLeft;
      const distance = targetLeft - startLeft;

      if (distance === 0 || pixelsPerSecond <= 0) {
        element.scrollLeft = targetLeft;
        return;
      }

      const duration = Math.abs(distance / pixelsPerSecond) * 1000;
      const startedAt = performance.now();

      const step = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);

        element.scrollLeft = startLeft + (distance * progress);

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(step);
          return;
        }

        animationFrameRef.current = null;
      };

      animationFrameRef.current = window.requestAnimationFrame(step);
    },
    [cancelScroll, pixelsPerSecond],
  );

  const scrollToEnd = React.useCallback(
    (element: HTMLElement) => {
      scrollTo(element, element.scrollWidth - element.clientWidth);
    },
    [scrollTo],
  );

  const scrollToStart = React.useCallback(
    (element: HTMLElement) => {
      scrollTo(element, 0);
    },
    [scrollTo],
  );

  const resetToStart = React.useCallback(
    (element: HTMLElement) => {
      cancelScroll();
      element.scrollLeft = 0;
    },
    [cancelScroll],
  );

  React.useEffect(() => cancelScroll, [cancelScroll]);

  return {
    cancelScroll,
    resetToStart,
    scrollToEnd,
    scrollToStart,
  };
}
