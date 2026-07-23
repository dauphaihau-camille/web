import {
  ChevronDownIcon,
  CheckIcon,
  LockIcon,
} from 'lucide-react';

import type { DocumentAccessGrantPermission } from '@/domains/document';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getPermissionLabel } from '../share-permissions';
import { PermissionMenuContent } from '../permission-menu-content';

export function GeneralAccessRow({
  disabled,
  workspaceMemberPermission,
  workspaceName,
  onWorkspaceMemberPermissionChange,
}: {
  disabled: boolean;
  workspaceMemberPermission?: DocumentAccessGrantPermission;
  workspaceName: string;
  onWorkspaceMemberPermissionChange: (
    permission: DocumentAccessGrantPermission | undefined,
  ) => void;
}) {
  const hasWorkspaceAccess = Boolean(workspaceMemberPermission);
  const workspaceInitial = (
    workspaceName.trim().charAt(0)
    || 'W'
  ).toUpperCase();

  const label = hasWorkspaceAccess
    ? `Everyone at ${workspaceName}`
    : 'Only people invited';

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-muted-foreground">
        General access
      </p>
      <div className="flex items-center gap-1">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          {hasWorkspaceAccess
            ? (
              <span className="text-sm font-semibold">
                {workspaceInitial}
              </span>
            )
            : <LockIcon className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={disabled}
              className="flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="truncate">{label}</span>
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuItem
                onClick={() => onWorkspaceMemberPermissionChange(undefined)}
              >
                <LockIcon className="mr-2 size-4" />
                <span className="flex-1">Only people invited</span>
                {!workspaceMemberPermission ? <CheckIcon className="size-4" /> : null}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onWorkspaceMemberPermissionChange(workspaceMemberPermission ?? 'view')}
              >
                <span className="mr-1 flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                  {workspaceInitial}
                </span>
                <span className="flex-1 truncate">Everyone at {workspaceName}</span>
                {workspaceMemberPermission ? <CheckIcon className="size-4" /> : null}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {workspaceMemberPermission
          ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={disabled}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {getPermissionLabel(workspaceMemberPermission)}
                <ChevronDownIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-70 p-2">
                <PermissionMenuContent
                  selectedPermission={workspaceMemberPermission}
                  showUserAccessLabel={false}
                  onChange={onWorkspaceMemberPermissionChange}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )
          : null}
      </div>
    </div>
  );
}
