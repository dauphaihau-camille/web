'use client';

import type { ReactNode } from 'react';
import {
  createContext, useEffect, useRef, useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';

export const OPEN_SHARE_EVENT = 'workspace:open-share';
export const COPY_LINK_EVENT = 'workspace:copy-link';
export const DUPLICATE_DOCUMENT_EVENT = 'workspace:duplicate-document';
export const TOGGLE_AI_CHAT_EVENT = 'workspace:toggle-ai-chat';

type WorkspaceShortcutsContextValue = {
  closeSearch: () => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  setSearchOpen: (open: boolean) => void;
};

export const WorkspaceShortcutsContext = createContext<WorkspaceShortcutsContextValue | null>(null);

export function WorkspaceShortcutsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const historyEntriesRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    const search = searchParams.toString();
    const location = search ? `${pathname}?${search}` : pathname;
    const historyEntries = historyEntriesRef.current;
    const currentIndex = historyIndexRef.current;

    if (currentIndex >= 0 && historyEntries[currentIndex] === location) {
      return;
    }

    if (currentIndex > 0 && historyEntries[currentIndex - 1] === location) {
      historyIndexRef.current = currentIndex - 1;
      return;
    }

    if (currentIndex >= 0 && currentIndex < historyEntries.length - 1 && historyEntries[currentIndex + 1] === location) {
      historyIndexRef.current = currentIndex + 1;
      return;
    }

    const nextEntries = historyEntries.slice(0, currentIndex + 1);
    nextEntries.push(location);
    historyEntriesRef.current = nextEntries;
    historyIndexRef.current = nextEntries.length - 1;
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) {
        return;
      }

      const hasPrimaryModifier = event.metaKey || event.ctrlKey;
      const hasOnlyPrimaryModifier = hasPrimaryModifier && !event.altKey && !event.shiftKey;
      const hasPrimaryAndShiftModifier = hasPrimaryModifier && event.shiftKey && !event.altKey;

      if (!hasOnlyPrimaryModifier) {
        if (!hasPrimaryAndShiftModifier) {
          return;
        }

        if (event.key.toLowerCase() === 's') {
          event.preventDefault();
          window.dispatchEvent(new CustomEvent(OPEN_SHARE_EVENT));
          return;
        }

        if (event.key.toLowerCase() === 'l') {
          event.preventDefault();
          window.dispatchEvent(new CustomEvent(COPY_LINK_EVENT));
          return;
        }

        if (event.key.toLowerCase() === 'a') {
          event.preventDefault();
          window.dispatchEvent(new CustomEvent(TOGGLE_AI_CHAT_EVENT));
          return;
        }

        if (event.key.toLowerCase() === 'm') {
          if (isTypingTarget(event.target)) {
            return;
          }

          event.preventDefault();
          setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
        }

        return;
      }

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      if (event.key.toLowerCase() === 'd') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent(DUPLICATE_DOCUMENT_EVENT));
        return;
      }

      if (event.key === '[') {
        event.preventDefault();

        if (historyIndexRef.current <= 0) {
          return;
        }

        router.back();
        return;
      }

      if (event.key === ']') {
        event.preventDefault();

        if (historyIndexRef.current >= historyEntriesRef.current.length - 1) {
          return;
        }

        router.forward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resolvedTheme, router, setTheme]);

  return (
    <WorkspaceShortcutsContext.Provider
      value={{
        closeSearch: () => {
          setIsSearchOpen(false);
        },
        isSearchOpen,
        openSearch: () => {
          setIsSearchOpen(true);
        },
        setSearchOpen: setIsSearchOpen,
      }}
    >
      {children}
    </WorkspaceShortcutsContext.Provider>
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable
    || target.tagName === 'INPUT'
    || target.tagName === 'TEXTAREA'
    || target.tagName === 'SELECT'
  );
}
