'use client';

import Link from 'next/link';
import { FileTextIcon, MoreHorizontalIcon } from 'lucide-react';

import { Input } from '@shared/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/components/ui/popover';
import { ScrollFade } from '@shared/components/ui/scroll-fade';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { workspaceRoutes } from '@shared/domains/workspace';

import { useDocumentTreeMore } from './use-document-tree-more';

export function DocumentTreeMoreButton({
  workspaceSlug,
  initialCursor,
}: {
  workspaceSlug: string;
  initialCursor: string;
}) {
  const {
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
  } = useDocumentTreeMore({
    initialCursor,
    workspaceId: workspaceSlug,
  });

  return (
    <SidebarMenuItem
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <MoreHorizontalIcon className="size-4 shrink-0" />
          <span>More</span>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={12}
          className="w-80 gap-3 rounded-2xl border border-sidebar-border bg-sidebar p-3 text-sidebar-foreground shadow-xl"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Input
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
            }}
            placeholder="Search..."
            className="bg-sidebar-accent/40"
          />
          <ScrollFade
            direction="y"
            fadeColor="var(--sidebar)"
            className="max-h-80 space-y-1 overflow-y-auto pr-1"
            onScroll={handleScroll}
          >
            {items.map((document) => (
              <Link
                key={document.id}
                href={workspaceRoutes.document(
                  workspaceSlug,
                  document.public_id,
                  document.title,
                )}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={handleDocumentClick}
              >
                <FileTextIcon className="size-4 shrink-0 text-sidebar-foreground/70" />
                <span className="truncate">{document.title}</span>
              </Link>
            ))}
            {!isFetchingMore && items.length === 0
              ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No documents found.
                </p>
              )
              : null}
            {isFetchingMore
              ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Loading...
                </p>
              )
              : null}
          </ScrollFade>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
