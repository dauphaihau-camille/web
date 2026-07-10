'use client';

import type { ReactNode } from 'react';

type MenuRowProps = {
  icon: ReactNode;
  label: string;
  shortcut?: string;
};

export function MenuRow({
  icon,
  label,
  shortcut,
}: MenuRowProps) {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1 truncate font-medium">{label}</div>
      {shortcut
        ? (
          <div className="shrink-0 text-xs tracking-widest text-muted-foreground">
            {shortcut}
          </div>
        )
        : null}
    </div>
  );
}
