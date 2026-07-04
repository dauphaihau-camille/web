'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDownIcon, EllipsisIcon, LogOutIcon, PlusIcon, SettingsIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  DropdownMenuCheckboxItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  authKeys, authRoutes, logout, useCurrentUserQuery, 
} from '@/domains/auth';
import {
  myWorkspaceListQueryOptions,
  workspaceKeys,
  useWorkspaceQuery,
  workspaceRoutes,
} from '@/domains/workspace';
import { cn } from '@/lib/utils';
import { CreateWorkspaceDialog } from './create-workspace-dialog';

export function WorkspaceUserDropdown({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const currentUserQuery = useCurrentUserQuery();
  const workspaceQuery = useWorkspaceQuery(workspaceSlug);
  const myWorkspacesQuery = useQuery({
    ...myWorkspaceListQueryOptions(),
    enabled: isOpen,
  });
  const currentUser = currentUserQuery.data;
  const workspace = workspaceQuery.data;
  const workspaces = myWorkspacesQuery.data ?? [];
  const visibleWorkspaces = workspaces.slice(0, 3);
  const overflowWorkspaces = workspaces.slice(3);
  const workspaceInitial = (workspace?.name?.trim().charAt(0) || workspaceSlug.trim().charAt(0) || 'W').toUpperCase();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.setQueryData(authKeys.currentUser(), null);
      queryClient.removeQueries({ queryKey: workspaceKeys.all });
      window.location.assign(authRoutes.login());
    },
  });

  return (
    <>
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          className={cn(
            'flex w-full items-center gap-3 rounded-lg border border-transparent bg-transparent px-2 py-2 text-left outline-hidden transition-colors hover:bg-sidebar-accent/40 focus-visible:ring-2 focus-visible:ring-sidebar-ring',
          )}
        >
          {workspace
            ? (
              <>
                <div className="flex size-6 shrink-0 items-center justify-center rounded bg-sidebar-accent text-sidebar-accent-foreground">
                  <span className="text-sm font-semibold">{workspaceInitial}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-sidebar-foreground">
                    {workspace.name}
                  </p>
                </div>
                <ChevronDownIcon className="size-4 text-sidebar-foreground/60" />
              </>
            )
            : (
              <>
                <Skeleton className="size-6 shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-28" />
                </div>
                <ChevronDownIcon className="size-4 text-sidebar-foreground/60" />
              </>
            )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={8} >
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded bg-sidebar-accent text-sidebar-accent-foreground">
                    <span className="text-sm font-semibold">{workspaceInitial}</span>
                  </div>
                  <p className="text-[14px] font-medium text-foreground">
                    {workspace?.name ?? 'Workspace'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentUser?.email ?? 'Loading session...'}
                </p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {myWorkspacesQuery.isLoading
              ? (
                <DropdownMenuItem disabled>
                  <div className="flex w-full items-center gap-2">
                    <Skeleton className="size-4 shrink-0 rounded-sm" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </DropdownMenuItem>
              )
              : null}
            {myWorkspacesQuery.isError
              ? (
                <DropdownMenuItem disabled>
                  <span className="truncate">Failed to load workspaces</span>
                </DropdownMenuItem>
              )
              : null}
            {!myWorkspacesQuery.isLoading && !myWorkspacesQuery.isError && workspaces.length === 0
              ? (
                <DropdownMenuItem disabled>
                  <span className="truncate">No workspaces yet</span>
                </DropdownMenuItem>
              )
              : null}
            {visibleWorkspaces.map((userWorkspace) => {
              const isCurrentWorkspace = userWorkspace.slug === (workspace?.slug ?? workspaceSlug);
              const userWorkspaceInitial = (userWorkspace.name.trim().charAt(0) || userWorkspace.slug.trim().charAt(0) || 'W').toUpperCase();

              return (
                <DropdownMenuCheckboxItem
                  key={userWorkspace.id}
                  checked={isCurrentWorkspace}
                  onClick={() => {
                    if (!isCurrentWorkspace) {
                      router.push(workspaceRoutes.detail(userWorkspace.slug));
                    }
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex size-4 shrink-0 items-center justify-center rounded bg-sidebar-accent text-sidebar-accent-foreground">
                      <span className="text-xs font-semibold">{userWorkspaceInitial}</span>
                    </div>
                    <span className="truncate">{userWorkspace.name}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              );
            })}
            {overflowWorkspaces.length > 0
              ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <EllipsisIcon />
                    <span>More</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {overflowWorkspaces.map((userWorkspace) => {
                      const isCurrentWorkspace = userWorkspace.slug === (workspace?.slug ?? workspaceSlug);
                      const userWorkspaceInitial = (userWorkspace.name.trim().charAt(0) || userWorkspace.slug.trim().charAt(0) || 'W').toUpperCase();

                      return (
                        <DropdownMenuCheckboxItem
                          key={userWorkspace.id}
                          checked={isCurrentWorkspace}
                          onClick={() => {
                            if (!isCurrentWorkspace) {
                              router.push(workspaceRoutes.detail(userWorkspace.slug));
                            }
                          }}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex size-4 shrink-0 items-center justify-center rounded bg-sidebar-accent text-sidebar-accent-foreground">
                              <span className="text-xs font-semibold">{userWorkspaceInitial}</span>
                            </div>
                            <span className="truncate">{userWorkspace.name}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
              : null}

            <DropdownMenuItem
              onClick={() => {
                setIsOpen(false);
                setIsCreateWorkspaceOpen(true);
              }}
            >
              <PlusIcon />
              <span>Create workspace</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push(workspaceRoutes.settings(workspaceSlug))}>
              <SettingsIcon />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            <LogOutIcon />
            <span>{logoutMutation.isPending ? 'Logging out...' : 'Log out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateWorkspaceDialog
        open={isCreateWorkspaceOpen}
        onOpenChange={setIsCreateWorkspaceOpen}
      />
    </>
  );
}
