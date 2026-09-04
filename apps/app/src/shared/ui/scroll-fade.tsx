'use client';

import * as React from 'react';

import { cn } from '@shared/lib/utils';

type ScrollFadeDirection = 'both' | 'x' | 'y' | 'top' | 'bottom' | 'left' | 'right';

export type ScrollFadeProps = React.HTMLAttributes<HTMLDivElement> & {
  direction?: ScrollFadeDirection;
  fadeColor?: string;
  fadeSize?: string;
  topOffset?: string;
};

function callHandler(
  handler: React.UIEventHandler<HTMLDivElement> | undefined,
  event: React.UIEvent<HTMLDivElement>,
) {
  if (handler) {
    handler(event);
  }
}

export const ScrollFade = React.forwardRef<HTMLDivElement, ScrollFadeProps>(function ScrollFadeComponent(
  {
    className,
    direction = 'y',
    fadeColor = 'var(--background)',
    fadeSize = '1.75rem',
    topOffset = '0px',
    onScroll,
    children,
    style,
    ...props
  },
  ref,
) {
  const internalRef = React.useRef<HTMLDivElement | null>(null);
  const [hasStartFade, setHasStartFade] = React.useState(false);
  const [hasEndFade, setHasEndFade] = React.useState(false);

  const syncFadeState = React.useCallback(() => {
    const element = internalRef.current;

    if (!element) {
      return;
    }

    const canScrollY = element.scrollHeight > element.clientHeight + 1;
    const canScrollX = element.scrollWidth > element.clientWidth + 1;

    if (direction === 'x') {
      setHasStartFade(canScrollX && element.scrollLeft > 0);
      setHasEndFade(
        canScrollX && element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      );
      return;
    }

    if (direction === 'left') {
      setHasStartFade(false);
      setHasEndFade(canScrollX && element.scrollLeft > 0);
      return;
    }

    if (direction === 'right') {
      setHasStartFade(false);
      setHasEndFade(
        canScrollX && element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      );
      return;
    }

    setHasStartFade(canScrollY && element.scrollTop > 0);
    setHasEndFade(
      canScrollY && element.scrollTop + element.clientHeight < element.scrollHeight - 1,
    );
  }, [direction]);

  React.useEffect(() => {
    syncFadeState();

    const element = internalRef.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(syncFadeState);
    const resizeObserver = new ResizeObserver(syncFadeState);

    resizeObserver.observe(element);
    Array.from(element.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [children, syncFadeState]);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node;

      if (typeof ref === 'function') {
        ref(node);
        return;
      }

      if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const fadeStyle = {
    '--scroll-fade-overlay-color': fadeColor,
    '--scroll-fade-overlay-size': fadeSize,
    '--scroll-fade-top-offset': topOffset,
    ...style,
  } as React.CSSProperties;

  const isHorizontal = direction === 'x' || direction === 'left' || direction === 'right';
  const showStart = direction === 'bottom' ? false : hasStartFade;
  const showEnd = direction === 'top' ? false : hasEndFade;
  const startOverlayClassName = isHorizontal
    ? 'absolute inset-y-0 left-0 z-10 w-[var(--scroll-fade-overlay-size)] bg-[linear-gradient(to_right,var(--scroll-fade-overlay-color),transparent)]'
    : 'sticky top-[var(--scroll-fade-top-offset)] z-10 -mb-[var(--scroll-fade-overlay-size)] block h-[var(--scroll-fade-overlay-size)] w-full bg-[linear-gradient(to_bottom,var(--scroll-fade-overlay-color),transparent)]';
  const endOverlayClassName = isHorizontal
    ? 'absolute inset-y-0 right-0 z-10 w-[var(--scroll-fade-overlay-size)] bg-[linear-gradient(to_left,var(--scroll-fade-overlay-color),transparent)]'
    : 'sticky bottom-0 z-10 -mt-[var(--scroll-fade-overlay-size)] block h-[var(--scroll-fade-overlay-size)] w-full bg-[linear-gradient(to_top,var(--scroll-fade-overlay-color),transparent)]';

  return (
    <div
      ref={setRefs}
      data-slot="scroll-fade"
      className={cn(isHorizontal && 'relative', className)}
      style={{ ...style, ...fadeStyle }}
      onScroll={(event) => {
        callHandler(onScroll, event);
        syncFadeState();
      }}
      {...props}
    >
      {showStart
        ? (
          <div aria-hidden="true" className={cn('pointer-events-none', startOverlayClassName)} />
        )
        : null}
      {children}
      {showEnd
        ? (
          <div
            aria-hidden="true"
            className={cn('pointer-events-none', endOverlayClassName)}
          />
        )
        : null}
    </div>
  );
});
