"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounceFn } from "ahooks";
import {
  CornerDownLeftIcon,
  FileIcon,
  FileTextIcon,
  SearchIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@shared/components/ui/empty";
import { Kbd } from "@shared/components/ui/kbd";
import {
  SidebarMenuBadge,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Skeleton } from "@shared/components/ui/skeleton";
import { useWorkspaceSearchDocumentsQuery } from "@/domains/search";
import { workspaceRoutes } from "@shared/domains/workspace";
import { cn } from "@shared/lib/utils";

import { useWorkspaceShortcuts } from "../../_hooks/use-workspace-shortcuts";

export function WorkspaceSearchButton({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [searchQueryValue, setSearchQueryValue] = useState("");
  const { isSearchOpen, openSearch, setSearchOpen } = useWorkspaceShortcuts();
  const {
    run: scheduleSearchQueryUpdate,
    cancel: cancelScheduledSearchQueryUpdate,
  } = useDebounceFn(
    (nextValue: string) => {
      setSearchQueryValue(nextValue);
    },
    { wait: 400 },
  );

  const searchQuery = useWorkspaceSearchDocumentsQuery(
    workspaceSlug,
    searchQueryValue,
    12,
    isSearchOpen,
  );
  const documents = searchQuery.data ?? [];
  const hasResults = documents.length > 0;

  return (
    <>
      <SidebarMenuButton
        tooltip="Search"
        onClick={() => {
          openSearch();
        }}
      >
        <SearchIcon />
        <span>Search</span>
      </SidebarMenuButton>

      <SidebarMenuBadge className="opacity-0 transition-opacity peer-hover/menu-button:opacity-100">
        <Kbd>⌘K</Kbd>
      </SidebarMenuBadge>

      <CommandDialog
        open={isSearchOpen}
        onOpenChange={(nextOpen) => {
          setSearchOpen(nextOpen);

          if (!nextOpen) {
            setSearchValue("");
            setSearchQueryValue("");
            cancelScheduledSearchQueryUpdate();
          }
        }}
        title="Search documents"
        description="Search by document title, document content, or reopen a recent document."
        className="top-[10vh]! h-140! translate-y-0! w-140! max-w-140! border-sidebar-border bg-sidebar text-sidebar-foreground"
        commandProps={{ shouldFilter: false }}
      >
        <CommandInput
          value={searchValue}
          onValueChange={(value) => {
            setSearchValue(value);
            scheduleSearchQueryUpdate(value.trim());
          }}
          placeholder="Search by title or content..."
        />
        <CommandList
          className={cn(
            "flex h-full min-h-0 max-h-none flex-1 flex-col",
            !searchQuery.isLoading && !hasResults && "justify-center",
          )}
        >
          {searchQuery.isLoading ? (
            <CommandGroup heading={searchValue.trim() ? "Results" : "Recent"}>
              {Array.from({ length: 4 }).map((_, index) => (
                <WorkspaceSearchItemSkeleton key={index} />
              ))}
            </CommandGroup>
          ) : null}
          {!searchQuery.isLoading ? (
            <CommandEmpty className="flex h-full w-full flex-1 items-center justify-center py-0">
              <Empty className="h-full w-full flex-1 justify-center rounded-none border-0 p-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchIcon />
                  </EmptyMedia>
                  <EmptyTitle>No documents found.</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </CommandEmpty>
          ) : null}
          {hasResults ? (
            <CommandGroup heading={searchValue.trim() ? "Results" : "Recent"}>
              {documents.map((document) => (
                <CommandItem
                  key={document.document_id}
                  value={[
                    document.title,
                    document.breadcrumb_path.join(" "),
                    document.updated_by_name,
                    document.matched_text,
                    document.document_id,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  className="items-start gap-2 rounded-2xl px-3 py-3 hover:bg-sidebar-foreground/8 data-selected:bg-sidebar-foreground/8"
                  onSelect={() => {
                    setSearchOpen(false);
                    router.push(
                      workspaceRoutes.document(
                        workspaceSlug,
                        document.public_id,
                        document.title,
                      ),
                    );
                  }}
                >
                  <DocumentSearchIcon hasContent={document.has_content} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-foreground">
                      {document.title}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[
                        formatBreadcrumbPath(document.breadcrumb_path),
                        document.updated_by_name,
                        `Edited ${formatRelativeTime(document.updated_at)}`,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                    {document.matched_text ? (
                      <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted-foreground">
                        {renderHighlightedText(
                          document.matched_text,
                          searchValue.trim(),
                        )}
                      </div>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
        <div className="border-t border-sidebar-border/70 bg-muted/70 px-3 py-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex size-7 items-center justify-center rounded-lg border border-sidebar-border/80 bg-background/80">
              <CornerDownLeftIcon className="size-4" />
            </span>
            <span>Go to page</span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}

function WorkspaceSearchItemSkeleton() {
  return (
    <div className="flex items-start gap-2 rounded-2xl px-3 py-3">
      <Skeleton className="mt-0.5 size-4 shrink-0 rounded-sm" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5 rounded" />
        <Skeleton className="h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}

function DocumentSearchIcon({ hasContent }: { hasContent: boolean }) {
  const Icon = hasContent ? FileTextIcon : FileIcon;

  return <Icon className="mt-0.5 size-4 shrink-0 text-sidebar-foreground/60" />;
}

function formatBreadcrumbPath(path: string[]) {
  if (path.length === 0) {
    return undefined;
  }

  if (path.length <= 2) {
    return path.join(" / ");
  }

  return `${path[0]} / ... / ${path[path.length - 1]}`;
}

function renderHighlightedText(text: string, query: string): ReactNode {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return text;
  }

  const matcher = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "ig");
  const segments = text.split(matcher);

  return segments.map((segment, index) =>
    segment.toLowerCase() === normalizedQuery.toLowerCase() ? (
      <span key={`${segment}-${index}`} className="font-medium text-sky-600">
        {segment}
      </span>
    ) : (
      <span key={`${segment}-${index}`}>{segment}</span>
    ),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatRelativeTime(value: string) {
  const targetDate = new Date(value);
  const diffInSeconds = Math.round((targetDate.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(diffInSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absoluteSeconds < 60) {
    return formatter.format(diffInSeconds, "second");
  }

  const diffInMinutes = Math.round(diffInSeconds / 60);

  if (Math.abs(diffInMinutes) < 60) {
    return formatter.format(diffInMinutes, "minute");
  }

  const diffInHours = Math.round(diffInMinutes / 60);

  if (Math.abs(diffInHours) < 24) {
    return formatter.format(diffInHours, "hour");
  }

  const diffInDays = Math.round(diffInHours / 24);

  return formatter.format(diffInDays, "day");
}
