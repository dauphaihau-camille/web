'use client';

import * as React from 'react';

import { ScrollFade } from '@/components/ui/scroll-fade';

type WorkspaceScrollFadeContextValue = {
  setTopOffset: (topOffset: string) => void;
};

const WorkspaceScrollFadeContext = React.createContext<WorkspaceScrollFadeContextValue | null>(null);

const DEFAULT_TOP_OFFSET = '2.75rem';

export function WorkspaceScrollFade({
  children,
}: {
  children: React.ReactNode;
}) {
  const [topOffset, setTopOffset] = React.useState(DEFAULT_TOP_OFFSET);

  const contextValue = React.useMemo<WorkspaceScrollFadeContextValue>(
    () => ({ setTopOffset }),
    [],
  );

  return (
    <WorkspaceScrollFadeContext.Provider value={contextValue}>
      <ScrollFade
        direction="y"
        fadeColor="var(--surface)"
        topOffset={topOffset}
        className="app-scrollbar h-full overflow-y-auto px-5"
        fadeSize="3rem"
      >
        {children}
      </ScrollFade>
    </WorkspaceScrollFadeContext.Provider>
  );
}

export function useWorkspaceScrollFadeTopOffset(topOffset: string) {
  const context = React.useContext(WorkspaceScrollFadeContext);

  React.useEffect(() => {
    if (!context) {
      return;
    }

    context.setTopOffset(topOffset);

    return () => {
      context.setTopOffset(DEFAULT_TOP_OFFSET);
    };
  }, [context, topOffset]);
}
