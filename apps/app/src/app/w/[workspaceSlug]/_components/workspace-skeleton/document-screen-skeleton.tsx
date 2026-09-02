import type { CSSProperties } from 'react';

import { Skeleton } from '@shared/components/ui/skeleton';

import motionStyles from '../_styles/cascade-enter.module.css';

const DOCUMENT_SCREEN_TITLE_SKELETON_WIDTH = `${randomInteger(58, 86)}%`;
const DOCUMENT_SCREEN_BODY_SKELETON_ROWS = createDocumentScreenBodySkeletonRows();

export function DocumentScreenSkeleton({
  animate = false,
}: {
  animate?: boolean;
}) {
  const headerClassName = `fixed inset-x-0 z-10 bg-surface px-2 backdrop-blur md:left-(--sidebar-width) ${animate ? motionStyles.cascadeEnter : ''}`;
  const contentClassName = `mx-auto max-w-2xl ${animate ? motionStyles.cascadeEnter : ''}`;

  const headerStyle = {
    top: '0px',
    ...(animate ? { '--enter-delay': '0ms' } : {}),
  } as CSSProperties;

  const contentStyle = {
    paddingTop: '110px',
    ...(animate ? { '--enter-delay': '120ms' } : {}),
  } as CSSProperties;

  return (
    <section className="space-y-6">
      <div className={headerClassName} style={headerStyle}>
        <div className="flex h-11 items-center justify-between gap-3">
          <Skeleton className="h-6 w-28 rounded px-1.5 py-1" />

          <div className="flex items-center gap-1.5">
            <Skeleton className="hidden h-6 w-28 rounded md:block" />
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        </div>
      </div>

      <div className={contentClassName} style={contentStyle}>
        <DocumentScreenBodySkeleton animate={animate} />
      </div>
    </section>
  );
}

export function DocumentScreenBodySkeleton({
  animate = false,
}: {
  animate?: boolean;
}) {
  return (
    <>
      <div className="space-y-3 px-[3.8rem]">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton
            className="h-12 rounded-lg md:h-14"
            style={{ width: DOCUMENT_SCREEN_TITLE_SKELETON_WIDTH }}
          />
        </div>
      </div>

      <div className="space-y-4 px-[3.8rem] pt-8">
        {DOCUMENT_SCREEN_BODY_SKELETON_ROWS.map((row, index) => (
          <Skeleton
            key={row.id}
            className={`h-5 ${animate ? motionStyles.cascadeEnter : ''}`}
            style={
              animate
                ? ({
                  width: row.width,
                  '--enter-delay': `${240 + (index * 70)}ms`,
                } as CSSProperties)
                : ({ width: row.width } as CSSProperties)
            }
          />
        ))}
      </div>
    </>
  );
}

function createDocumentScreenBodySkeletonRows() {
  const rowCount = randomInteger(6, 11);

  return Array.from({ length: rowCount }, (unusedValue, index) => ({
    id: `row-${index + 1}`,
    width: `${randomInteger(54, 100)}%`,
  }));
}

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
