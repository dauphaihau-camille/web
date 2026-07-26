'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ScrollFade } from '@/components/ui/scroll-fade';
import { useWorkspaceDocumentRootQuery } from '@/domains/document';
import { useWorkspaceFavoritesQuery } from '@/domains/favorite';
import { useWorkspaceQuery } from '@/domains/workspace';

import { WorkspaceSidebarActionsSkeleton } from '../workspace-skeleton/workspace-sidebar-actions-skeleton';
import { WorkspaceSidebarTreeSkeleton } from '../workspace-skeleton/workspace-sidebar-tree-skeleton';
import { WorkspaceUserDropdown } from '../workspace-user-dropdown';
import { PrivateDocumentsGroup } from './private-documents-group';
import { FavoritesDocumentsGroup } from './favorites-documents-group';
import { SharedDocumentsGroup } from './shared-documents-group';
import { TeamspacesGroup } from './teamspaces-group';
import { WorkspaceSearchButton } from './workspace-search-button';
import { WorkspaceTrashButton } from './workspace-trash-button/workspace-trash-button';

export function WorkspaceSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const workspaceQuery = useWorkspaceQuery(workspaceSlug);
  const favoritesQuery = useWorkspaceFavoritesQuery(workspaceSlug);
  const rootQuery = useWorkspaceDocumentRootQuery(workspaceSlug);

  const canEditTeamspaceDocuments =
    workspaceQuery.data?.current_user_role === 'owner'
    || workspaceQuery.data?.current_user_role === 'admin';

  const isInitialWorkspaceLoading =
    !workspaceQuery.data
    && (workspaceQuery.isPending || workspaceQuery.isLoading);

  const isInitialTreeLoading =
    !favoritesQuery.data
    && !rootQuery.data
    && (favoritesQuery.isPending || favoritesQuery.isLoading)
    && (rootQuery.isPending || rootQuery.isLoading);

  const isInitialSidebarLoading = isInitialWorkspaceLoading || isInitialTreeLoading;

  return (
    <Sidebar
      collapsible="none"
      className="h-svh min-h-0 self-stretch border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="gap-3 p-1">
        <WorkspaceUserDropdown
          workspaceSlug={workspaceSlug}
          workspace={workspaceQuery.data}
        />
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <ScrollFade
          direction="y"
          fadeColor="var(--sidebar)"
          className="no-scrollbar min-h-0 flex-1 overflow-y-auto"
        >
          <div className="flex min-h-full flex-col gap-0 pb-20">
            {isInitialWorkspaceLoading
              ? (
                <WorkspaceSidebarActionsSkeleton />
              )
              : (
                <SidebarGroup className="pt-0">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem className="font-semibold">
                        <WorkspaceSearchButton workspaceSlug={workspaceSlug} />
                      </SidebarMenuItem>
                      <SidebarMenuItem className="font-semibold">
                        <WorkspaceTrashButton workspaceSlug={workspaceSlug} />
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

            {isInitialSidebarLoading
              ? (
                <WorkspaceSidebarTreeSkeleton animate />
              )
              : (
                <>
                  <FavoritesDocumentsGroup
                    workspaceSlug={workspaceSlug}
                    favoritesQuery={favoritesQuery}
                  />
                  <PrivateDocumentsGroup
                    workspaceSlug={workspaceSlug}
                    rootQuery={rootQuery}
                  />
                  <TeamspacesGroup
                    workspaceSlug={workspaceSlug}
                    rootQuery={rootQuery}
                    canEditDocuments={canEditTeamspaceDocuments}
                  />
                  <SharedDocumentsGroup
                    workspaceSlug={workspaceSlug}
                    rootQuery={rootQuery}
                  />
                </>
              )}
          </div>
        </ScrollFade>
      </SidebarContent>
    </Sidebar>
  );
}
