'use client';

import { useState, type FormEvent } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMember,
  workspaceKeys,
  workspaceMemberListQueryOptions,
  type Workspace,
  type WorkspaceMember,
  type WorkspaceRole,
} from '@/domains/workspace';

const roleOptions: WorkspaceRole[] = ['owner', 'admin', 'member'];

export function MembersPanel({
  workspace,
}: {
  workspace: Workspace;
}) {
  const queryClient = useQueryClient();
  const membersQuery = useQuery(workspaceMemberListQueryOptions(workspace.id));
  const members = membersQuery.data ?? [];
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
  const [addMemberErrorMessage, setAddMemberErrorMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canManageMembers = workspace.current_user_role === 'owner' || workspace.current_user_role === 'admin';

  const addMemberMutation = useMutation({
    mutationFn: () =>
      addWorkspaceMember(workspace.id, {
        email,
        role,
      }),
    onSuccess: async () => {
      setEmail('');
      setRole('member');
      setAddMemberErrorMessage(null);
      setErrorMessage(null);
      setIsAddMemberDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.memberList(workspace.id),
      });
    },
    onError: (error) => {
      setAddMemberErrorMessage(
        error instanceof Error ? error.message : 'Could not add workspace member.',
      );
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({
      memberId,
      version,
      nextRole,
    }: {
      memberId: string;
      version: number;
      nextRole: WorkspaceRole;
    }) =>
      updateWorkspaceMember(workspace.id, memberId, {
        version,
        role: nextRole,
      }),
    onSuccess: async () => {
      setErrorMessage(null);
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.memberList(workspace.id),
      });
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not update workspace member.',
      );
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeWorkspaceMember(workspace.id, memberId),
    onSuccess: async () => {
      setErrorMessage(null);
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.memberList(workspace.id),
      });
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not remove workspace member.',
      );
    },
  });

  function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddMemberErrorMessage(null);
    addMemberMutation.mutate();
  }

  function handleAddMemberDialogOpenChange(open: boolean) {
    setIsAddMemberDialogOpen(open);
    if (!open) {
      setAddMemberErrorMessage(null);
    }
  }

  const columns: ColumnDef<WorkspaceMember>[] = [
    {
      accessorKey: 'display_name',
      header: 'Member',
      cell: ({ row }) => (
        <div className="min-w-48">
          <p className="font-medium">{row.original.display_name ?? row.original.email}</p>
          <p className="text-sm text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const member = row.original;
        const canEditThisMember = canManageMembers
          && (workspace.current_user_role === 'owner' || member.role !== 'owner');

        if (!canEditThisMember) {
          return (
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {member.role}
            </span>
          );
        }

        return (
          <select
            value={member.role}
            onChange={(event) =>
              updateMemberMutation.mutate({
                memberId: member.id,
                version: member.version,
                nextRole: event.target.value as WorkspaceRole,
              })}
            disabled={updateMemberMutation.isPending}
            className="h-8 min-w-28 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {roleOptions.map((option) => (
              <option
                key={option}
                value={option}
                disabled={option === 'owner' && workspace.current_user_role !== 'owner'}
              >
                {option}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const member = row.original;
        const canEditThisMember = canManageMembers
          && (workspace.current_user_role === 'owner' || member.role !== 'owner');

        if (!canEditThisMember) {
          return null;
        }

        return (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => removeMemberMutation.mutate(member.id)}
              disabled={removeMemberMutation.isPending}
            >
              Remove
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="">
      {canManageMembers
        ? (
          <div className="mt-4 flex justify-end">
            <Dialog open={isAddMemberDialogOpen} onOpenChange={handleAddMemberDialogOpenChange}>
              <DialogTrigger render={<Button />}>Add member</DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add member</DialogTitle>
                  <DialogDescription>
                    Invite someone to this workspace and choose their starting role.
                  </DialogDescription>
                </DialogHeader>
                <form className="grid gap-4" onSubmit={handleAddMember}>
                  <div className="space-y-2">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="member@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-role">Role</Label>
                    <select
                      id="member-role"
                      value={role}
                      onChange={(event) => setRole(event.target.value as WorkspaceRole)}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {roleOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  {addMemberErrorMessage
                    ? <p className="text-sm text-destructive">{addMemberErrorMessage}</p>
                    : null}
                  <div className="flex justify-end">
                    <Button
                      disabled={addMemberMutation.isPending || email.trim().length === 0}
                      type="submit"
                    >
                      {addMemberMutation.isPending ? 'Adding...' : 'Add member'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )
        : null}
      {errorMessage ? <p className="mt-4 text-sm text-destructive">{errorMessage}</p> : null}
      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {membersQuery.isLoading
              ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    Loading members...
                  </TableCell>
                </TableRow>
              )
              : null}
            {!membersQuery.isLoading && table.getRowModel().rows.length > 0
              ? table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
              : null}
            {!membersQuery.isLoading && table.getRowModel().rows.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No members found.
                  </TableCell>
                </TableRow>
              )
              : null}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
