'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import type * as React from 'react';

import { cn } from '@shared/lib/utils';

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const normalizedValue = value === null
    ? 0
    : Math.min(Math.max(value, props.min ?? 0), props.max ?? 100);
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const percent = value === null
    ? 0
    : ((normalizedValue - min) / (max - min)) * 100;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-muted',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className="h-full w-full"
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="h-full w-full flex-1 rounded-full bg-primary transition-transform"
          style={{ transform: `translateX(-${100 - percent}%)` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
