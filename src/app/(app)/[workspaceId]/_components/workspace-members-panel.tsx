'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMember,
  workspaceKeys,
  workspaceMemberListQueryOptions,
  type Workspace,
  type WorkspaceRole,
} from '@/domains/workspace';

const roleOptions: WorkspaceRole[] = ['owner', 'admin', 'member'];

export function WorkspaceMembersPanel({
  workspace,
}: {
  workspace: Workspace;
}) {
  const queryClient = useQueryClient();
  const membersQuery = useQuery(workspaceMemberListQueryOptions(workspace.id));
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
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
      setErrorMessage(null);
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.memberList(workspace.id),
      });
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Could not add workspace member.');
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
    setErrorMessage(null);
    addMemberMutation.mutate();
  }

  return (
    <section className="rounded-2xl border p-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Members</h3>
        <p className="text-sm text-muted-foreground">
          Workspace membership now comes from <span className="font-mono">/workspaces/:id/members</span>.
        </p>
      </div>
      {canManageMembers
        ? (
          <form className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_140px_auto]" onSubmit={handleAddMember}>
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
            <div className="flex items-end">
              <Button
                disabled={addMemberMutation.isPending || email.trim().length === 0}
                type="submit"
              >
                {addMemberMutation.isPending ? 'Adding...' : 'Add member'}
              </Button>
            </div>
          </form>
        )
        : null}
      {errorMessage ? <p className="mt-4 text-sm text-destructive">{errorMessage}</p> : null}
      <div className="mt-6 space-y-3">
        {membersQuery.isLoading
          ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          )
          : null}
        {membersQuery.data?.map((member) => {
          const canEditThisMember = canManageMembers
            && (workspace.current_user_role === 'owner' || member.role !== 'owner');

          return (
            <div
              key={member.id}
              className="flex flex-col gap-3 rounded-xl border bg-muted/10 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium">{member.display_name ?? member.email}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {member.role}
                </span>
                {canEditThisMember
                  ? (
                    <div className="flex gap-2">
                      <select
                        value={member.role}
                        onChange={(event) =>
                          updateMemberMutation.mutate({
                            memberId: member.id,
                            version: member.version,
                            nextRole: event.target.value as WorkspaceRole,
                          })}
                        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                      <Button
                        variant="outline"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        disabled={removeMemberMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  )
                  : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
