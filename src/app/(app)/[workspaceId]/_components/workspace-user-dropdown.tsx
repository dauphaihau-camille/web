'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDownIcon, LogOutIcon, PanelLeftIcon, Settings2Icon, 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  authKeys, authRoutes, logout, useCurrentUserQuery, 
} from '@/domains/auth';
import { workspaceKeys, useWorkspaceQuery, workspaceRoutes } from '@/domains/workspace';
import { cn } from '@/lib/utils';

export function WorkspaceUserDropdown({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUserQuery();
  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const currentUser = currentUserQuery.data;
  const workspace = workspaceQuery.data;

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.setQueryData(authKeys.currentUser(), null);
      queryClient.removeQueries({ queryKey: workspaceKeys.all });
      window.location.assign(authRoutes.login());
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border border-transparent bg-transparent px-3 py-2 text-left outline-hidden transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
          <PanelLeftIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {workspace?.name ?? 'Loading workspace...'}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            {currentUser?.displayName ?? currentUser?.email ?? workspaceId}
          </p>
        </div>
        <ChevronDownIcon className="size-4 text-sidebar-foreground/60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {workspace?.name ?? 'Workspace'}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.displayName ?? currentUser?.email ?? 'Loading session...'}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <span className="truncate">/{workspace?.slug ?? workspaceId}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(workspaceRoutes.settings(workspaceId))}>
            <Settings2Icon />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
        >
          <LogOutIcon />
          <span>{logoutMutation.isPending ? 'Logging out...' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
