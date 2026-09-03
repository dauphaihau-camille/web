'use client';

import * as React from 'react';

import { ScrollFade } from '@/components/ui/scroll-fade';

type WorkspaceScrollFadeContextValue = {
  setTopInset: (topInset: string) => void;
  setTopOffset: (topOffset: string) => void;
};

const WorkspaceScrollFadeContext = React.createContext<WorkspaceScrollFadeContextValue | null>(null);

const DEFAULT_TOP_OFFSET = '2.75rem';
const DEFAULT_TOP_INSET = '0px';
export function WorkspaceScrollFade({
  children,
}: {
  children: React.ReactNode;
}) {
  const [topOffset, setTopOffset] = React.useState(DEFAULT_TOP_OFFSET);
  const [topInset, setTopInset] = React.useState(DEFAULT_TOP_INSET);

  const contextValue = React.useMemo<WorkspaceScrollFadeContextValue>(
    () => ({ setTopInset, setTopOffset }),
    [],
  );

  return (
    <WorkspaceScrollFadeContext.Provider value={contextValue}>
      <ScrollFade
        direction="y"
        fadeColor="var(--surface)"
        topOffset={topOffset}
        className="app-scrollbar mt-[var(--workspace-scroll-top-inset)] h-[calc(100%-var(--workspace-scroll-top-inset))] overflow-y-auto px-5"
        fadeSize="3rem"
        style={{
          '--workspace-scroll-top-inset': topInset,
        } as React.CSSProperties}
      >
        {children}
      </ScrollFade>
    </WorkspaceScrollFadeContext.Provider>
  );
}

export function useWorkspaceScrollFadeTopOffset(topOffset: string, topInset = DEFAULT_TOP_INSET) {
  const context = React.useContext(WorkspaceScrollFadeContext);

  React.useEffect(() => {
    if (!context) {
      return;
    }

    context.setTopOffset(topOffset);
    context.setTopInset(topInset);

    return () => {
      context.setTopInset(DEFAULT_TOP_INSET);
      context.setTopOffset(DEFAULT_TOP_OFFSET);
    };
  }, [context, topInset, topOffset]);
}
