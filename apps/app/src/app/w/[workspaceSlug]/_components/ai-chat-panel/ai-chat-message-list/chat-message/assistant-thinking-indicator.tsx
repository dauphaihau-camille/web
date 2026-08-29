'use client';

import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────
 * LOADING STATE — pixel-grid loader for long-running work
 *
 * Variants:
 *   Drive  — square cells, chevron wavefront driving right;
 *            the 650ms cycle is shorter than the sweep, so
 *            two fronts are always in flight
 *   Dots   — same wavefront, circular cells
 *   Orbit  — a comet lapping the grid perimeter
 *   Surfer — the Drive loader paired with a meme video below
 *
 * Paired with a shimmering label and a live elapsed timer
 * in mono tabular figures. Reduced motion freezes the grid
 * to its dim state; the timer still ticks.
 * ───────────────────────────────────────────────────────── */

const gridCellIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const chevron = gridCellIndexes.map((cellIndex) => {
  const row = Math.floor(cellIndex / 3);
  const column = cellIndex % 3;

  return (column + Math.abs(row - 1)) * 90;
});

const orbitOrder = [0, 1, 2, 5, 8, 7, 6, 3];

const orbit = gridCellIndexes.map((cellIndex) => {
  const key = orbitOrder.indexOf(cellIndex);

  return key === -1 ? null : key * 110;
});

const patterns: Record<string, { delays: (number | null)[]; duration: number; round: boolean }> = {
  Drive: { delays: chevron, duration: 650, round: false },
  Dots: { delays: chevron, duration: 650, round: true },
  Orbit: { delays: orbit, duration: 950, round: false },
};

export function AssistantThinkingIndicator({
  label,
  variant = 'Drive',
  ariaLabel,
}: {
  label?: string;
  variant?: string;
  ariaLabel?: string;
}) {
  const elapsed = useElapsed();
  const resolvedLabel = label ?? 'Churning';
  const { delays, duration, round } = patterns[variant] ?? patterns.Drive;

  return (
    <div role="status" aria-label={ariaLabel} className="flex w-fit items-center gap-2.5">
      <LoaderGrid delays={delays} duration={duration} round={round} />
      <span
        className="bg-clip-text text-[13px] font-medium text-transparent"
        style={{
          backgroundImage:
            'linear-gradient(90deg, var(--muted-foreground) 35%, var(--foreground) 50%, var(--muted-foreground) 65%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-text 1.4s linear infinite',
        }}
      >
        {resolvedLabel}
      </span>
      <span className="font-mono text-[12px] tabular-nums text-muted-foreground">{elapsed}</span>
    </div>
  );
}


function LoaderGrid({
  delays,
  duration,
  round,
}: {
  delays: (number | null)[];
  duration: number;
  round: boolean;
}) {
  return (
    <span aria-hidden className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
      {delays.map((delay, cellIndex) => ({ delay, id: `loader-grid-cell-${cellIndex}` })).map(({ delay, id }) => (
        <span
          key={id}
          className={`size-[4px] bg-foreground ${round ? 'rounded-full' : 'rounded-[1px]'}`}
          style={{
            opacity: delay === null ? 0.07 : 0.15,
            animation: delay === null ? 'none' : `pixel-on ${duration}ms ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </span>
  );
}

function useElapsed() {
  const [deciseconds, setDeciseconds] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDeciseconds((currentDeciseconds) => currentDeciseconds + 1);
    }, 100);

    return () => window.clearInterval(intervalId);
  }, []);

  const totalSeconds = deciseconds / 10;

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }

  return `${Math.floor(totalSeconds / 60)}m ${(totalSeconds % 60).toFixed(1)}s`;
}
