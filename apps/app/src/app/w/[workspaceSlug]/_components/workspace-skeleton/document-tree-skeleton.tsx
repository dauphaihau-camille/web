'use client';

import type { CSSProperties } from 'react';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';

import motionStyles from '../_styles/cascade-enter.module.css';

const DEFAULT_SKELETON_WIDTHS = ['72%', '55%', '83%', '64%'] as const;

export function DocumentTreeSkeleton({
  amount = DEFAULT_SKELETON_WIDTHS.length,
  animate = false,
}: {
  amount?: number;
  animate?: boolean;
}) {
  const skeletonWidths = Array.from({ length: amount }, (_, index) =>
    DEFAULT_SKELETON_WIDTHS[index % DEFAULT_SKELETON_WIDTHS.length],
  );

  return (
    <div>
      <SidebarMenu className="space-y-0.5">
        {skeletonWidths.map((textWidth, index) => (
          <SidebarMenuItem
            key={`${textWidth}-${index}`}
            className={animate ? motionStyles.cascadeEnter : undefined}
            style={
              animate
                ? ({
                  '--enter-delay': `${index * 120}ms`,
                } as CSSProperties)
                : undefined
            }
          >
            <SidebarMenuSkeleton showIcon textWidth={textWidth} />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
