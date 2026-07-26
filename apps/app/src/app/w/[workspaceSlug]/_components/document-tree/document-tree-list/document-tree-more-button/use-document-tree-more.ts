'use client';

import {
  useEffect, useRef, useState, 
} from 'react';
import type { UIEvent } from 'react';
import { useDebounce } from 'ahooks';
import { useQueryClient } from '@tanstack/react-query';

import {
  type DocumentNavigationNode,
  workspaceDocumentRootQueryOptions,
} from '@/domains/document';

function filterPrivateDocuments(items: DocumentNavigationNode[]): DocumentNavigationNode[] {
  return items.filter((document) =>
    (document.access_scope ?? 'private') === 'private'
    || document.is_owned_by_current_user === true);
}

export function useDocumentTreeMore({
  initialCursor,
  workspaceId,
}: {
  initialCursor: string;
  workspaceId: string;
}) {
  const queryClient = useQueryClient();
  const closeTimerRef = useRef<number | null>(null);
  const latestRequestIdRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearchValue = useDebounce(searchValue.trim(), { wait: 300 });
  const [items, setItems] = useState<DocumentNavigationNode[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    setItems([]);
    setSearchValue('');
    setNextCursor(undefined);
  }, [initialCursor]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearCloseTimer();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  const loadPage = async ({
    cursor,
    query,
    replace,
  }: {
    cursor?: string;
    query?: string;
    replace: boolean;
  }) => {
    if (isFetchingMore) {
      return;
    }

    setIsFetchingMore(true);
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    try {
      const page = await queryClient.fetchQuery(
        workspaceDocumentRootQueryOptions(workspaceId, 50, cursor, query),
      );

      if (latestRequestIdRef.current !== requestId) {
        return;
      }

      setItems((currentItems) => (
        replace
          ? filterPrivateDocuments(page.private_documents.items)
          : [...currentItems, ...filterPrivateDocuments(page.private_documents.items)]
      ));
      setNextCursor(page.private_documents.next_cursor);
    }
    finally {
      if (latestRequestIdRef.current === requestId) {
        setIsFetchingMore(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setItems([]);
    setNextCursor(undefined);
    void loadPage({
      cursor: debouncedSearchValue ? undefined : initialCursor,
      query: debouncedSearchValue || undefined,
      replace: true,
    });
  }, [debouncedSearchValue, initialCursor, isOpen]);

  useEffect(() => () => {
    clearCloseTimer();
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      clearCloseTimer();
    }
    setIsOpen(open);
  };

  const handleDocumentClick = () => {
    setIsOpen(false);
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom < 80 && nextCursor) {
      void loadPage({
        cursor: nextCursor,
        query: debouncedSearchValue || undefined,
        replace: false,
      });
    }
  };

  return {
    handleDocumentClick,
    handleMouseEnter,
    handleMouseLeave,
    handleOpenChange,
    handleScroll,
    isFetchingMore,
    isOpen,
    items,
    searchValue,
    setSearchValue,
  };
}
