'use client';

import { useId, useState } from 'react';
import { ChevronRightIcon } from 'lucide-react';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import type { useWorkspaceDocumentRootQuery } from '@/domains/document';
import type { TeamspaceDocumentNavigationGroup } from '@/domains/document';
import { cn } from '@shared/lib/utils';

import { DocumentTreeList } from '../document-tree/document-tree-list/document-tree-list';
import { DocumentTreeSkeleton } from '../workspace-skeleton/document-tree-skeleton';
import { CollapsibleSidebarGroup } from './collapsible-sidebar-group';

export function TeamspacesGroup({
  workspaceSlug,
  rootQuery,
  canEditDocuments = false,
}: {
  workspaceSlug: string;
  rootQuery?: ReturnType<typeof useWorkspaceDocumentRootQuery>;
  canEditDocuments?: boolean;
}) {
  if (!rootQuery || rootQuery.isLoading) {
    return (
      <CollapsibleSidebarGroup label="Teamspaces">
        <DocumentTreeSkeleton animate />
      </CollapsibleSidebarGroup>
    );
  }

  if (rootQuery.isError || !rootQuery.data) {
    return (
      <CollapsibleSidebarGroup label="Teamspaces">
        <p className="px-2 py-1 text-xs text-muted-foreground">Teamspaces unavailable.</p>
      </CollapsibleSidebarGroup>
    );
  }

  if (rootQuery.data.teamspaces.length === 0) {
    return (
      <CollapsibleSidebarGroup label="Teamspaces">
        <p className="px-2 py-1 text-xs text-muted-foreground">No teamspaces yet.</p>
      </CollapsibleSidebarGroup>
    );
  }

  return (
    <CollapsibleSidebarGroup label="Teamspaces">
      <SidebarMenu className="space-y-0.5">
        {rootQuery.data.teamspaces.map((teamspace) => (
          <TeamspaceTreeSection
            key={teamspace.id}
            workspaceSlug={workspaceSlug}
            teamspace={teamspace}
            canEditDocuments={canEditDocuments}
          />
        ))}
      </SidebarMenu>
    </CollapsibleSidebarGroup>
  );
}

function TeamspaceTreeSection({
  workspaceSlug,
  teamspace,
  canEditDocuments,
}: {
  workspaceSlug: string;
  teamspace: TeamspaceDocumentNavigationGroup;
  canEditDocuments: boolean;
}) {
  const contentId = useId();
  const [isExpanded, setIsExpanded] = useState(true);
  const teamspaceInitial = teamspace.name.trim().charAt(0).toUpperCase() || '?';

  const hasDocuments =
    teamspace.documents.items.length > 0
    || Boolean(teamspace.documents.next_cursor);

  const canCollapse =
    teamspace.documents.items.some((document) => document.has_children);

  return (
    <SidebarMenuItem>
      <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-0 py-0">
        <SidebarMenuSubItem>
          <SidebarMenuSubButton
            render={<button type="button" />}
            aria-controls={canCollapse ? contentId : undefined}
            aria-expanded={canCollapse ? isExpanded : undefined}
            className={cn(
              'w-full pr-2 group-hover/menu-sub-item:bg-sidebar-accent group-hover/menu-sub-item:text-sidebar-accent-foreground group-focus-within/menu-sub-item:bg-sidebar-accent group-focus-within/menu-sub-item:text-sidebar-accent-foreground',
              'focus-visible:ring-2 focus-visible:ring-sidebar-ring',
            )}
            onClick={() => {
              if (!canCollapse) {
                return;
              }

              setIsExpanded((current) => !current);
            }}
          >
            <span className="relative flex size-4 shrink-0 items-center justify-center">
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 flex items-center justify-center rounded bg-sidebar-accent text-sidebar-accent-foreground transition-opacity',
                  canCollapse ? 'group-hover/menu-sub-item:opacity-0' : '',
                )}
              >
                <span className="text-[10px] font-semibold leading-none">
                  {teamspaceInitial}
                </span>
              </span>
              {canCollapse
                ? (
                  <ChevronRightIcon
                    className={cn(
                      'absolute inset-0 size-4 opacity-0 transition-all group-hover/menu-sub-item:opacity-100',
                      isExpanded ? 'rotate-90' : '',
                    )}
                  />
                )
                : null}
            </span>
            <span className="font-semibold">{teamspace.name}</span>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      </SidebarMenuSub>

      {hasDocuments && (!canCollapse || isExpanded)
        ? (
          <div id={contentId} className="pl-3 pt-1">
            <DocumentTreeList
              workspaceSlug={workspaceSlug}
              items={teamspace.documents.items}
              emptyMessage="No documents yet."
              nextCursor={teamspace.documents.next_cursor}
              actionMode={canEditDocuments ? 'full' : 'readOnly'}
            />
          </div>
        )
        : null}
    </SidebarMenuItem>
  );
}
