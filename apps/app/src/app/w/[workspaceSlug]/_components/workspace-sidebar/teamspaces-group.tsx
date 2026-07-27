'use client';

import { useId, useState } from 'react';
import { ChevronRightIcon, PlusIcon } from 'lucide-react';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import { LoadingIcon } from '@shared/components/loading-icon';
import { buttonVariants } from '@shared/components/ui/button';

import { DocumentTreeList } from '../document-tree/document-tree-list/document-tree-list';
import { DocumentTreeSkeleton } from '../workspace-skeleton/document-tree-skeleton';
import { CreateDocumentButton } from '../create-document-button';
import { CollapsibleSidebarGroup } from './collapsible-sidebar-group';
import { CreateTeamspaceDialog } from '../create-teamspace-dialog';
import { useCreateRootDocumentAction } from './use-create-root-document-action';

export function TeamspacesGroup({
  workspaceSlug,
  rootQuery,
  canEditDocuments = false,
}: {
  workspaceSlug: string;
  rootQuery?: ReturnType<typeof useWorkspaceDocumentRootQuery>;
  canEditDocuments?: boolean;
}) {
  const [isCreateTeamspaceOpen, setIsCreateTeamspaceOpen] = useState(false);

  let teamspacesContent;

  if (!rootQuery || rootQuery.isLoading) {
    teamspacesContent = <DocumentTreeSkeleton animate />;
  }
  else if (rootQuery.isError || !rootQuery.data) {
    teamspacesContent = (
      <p className="px-2 py-1 text-xs text-muted-foreground">Teamspaces unavailable.</p>
    );
  }
  else if (rootQuery.data.teamspaces.length === 0) {
    teamspacesContent = (
      <p className="px-2 py-1 text-xs text-muted-foreground">No teamspaces yet.</p>
    );
  }
  else {
    teamspacesContent = (
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
    );
  }

  return (
    <>
      <CollapsibleSidebarGroup
        label="Teamspaces"
        actions={
          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={
                <CreateDocumentButton
                  ariaLabel="New teamspace"
                  onClick={() => setIsCreateTeamspaceOpen(true)}
                />
              }
            />
            <TooltipContent side="bottom">New teamspace</TooltipContent>
          </Tooltip>
        }
      >
        {teamspacesContent}
      </CollapsibleSidebarGroup>

      <CreateTeamspaceDialog
        open={isCreateTeamspaceOpen}
        workspaceSlug={workspaceSlug}
        onOpenChange={setIsCreateTeamspaceOpen}
      />
    </>
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

  const {
    createDocumentMutation,
    handleCreateDocument,
  } = useCreateRootDocumentAction(workspaceSlug, {
    teamspaceId: teamspace.id,
  });

  const hasDocuments =
    teamspace.documents.items.length > 0
    || Boolean(teamspace.documents.next_cursor);

  const canCollapse = hasDocuments;

  const treeScope = `teamspace:${teamspace.id}` as const;

  const createTeamspaceDocumentButton = (
    <button
      type="button"
      aria-label={`Add document to ${teamspace.name}`}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
        'size-5 rounded-sm bg-transparent text-sidebar-foreground/70 hover:!bg-sidebar-accent-foreground/5 hover:text-sidebar-accent-foreground',
      )}
      disabled={createDocumentMutation.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleCreateDocument();
      }}
    >
      {createDocumentMutation.isPending
        ? <LoadingIcon className="size-4" />
        : <PlusIcon className="size-4" />}
    </button>
  );

  return (
    <SidebarMenuItem>
      <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-0 py-0">
        <SidebarMenuSubItem>
          <SidebarMenuSubButton
            render={<button type="button" />}
            aria-controls={canCollapse ? contentId : undefined}
            aria-expanded={canCollapse ? isExpanded : undefined}
            className={cn(
              'w-full pr-2 group-hover/menu-sub-item:bg-sidebar-accent group-hover/menu-sub-item:text-sidebar-accent-foreground active:bg-transparent active:text-sidebar-foreground/70',
              canEditDocuments ? 'group-hover/menu-sub-item:pr-8 group-focus-within/menu-sub-item:pr-8' : '',
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

          {canEditDocuments
            ? (
              <div className="absolute inset-y-0 right-1 z-20 flex items-center rounded pr-0.5 pl-1 opacity-0 transition-opacity group-hover/menu-sub-item:opacity-100 group-focus-within/menu-sub-item:opacity-100">
                <Tooltip>
                  <TooltipTrigger delay={0} render={createTeamspaceDocumentButton} />
                  <TooltipContent side="bottom">Add a document inside</TooltipContent>
                </Tooltip>
              </div>
            )
            : null}
        </SidebarMenuSubItem>
      </SidebarMenuSub>

      {hasDocuments && (!canCollapse || isExpanded)
        ? (
          <div id={contentId} className="pl-3 pt-1">
            <DocumentTreeList
              workspaceSlug={workspaceSlug}
              treeScope={treeScope}
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
