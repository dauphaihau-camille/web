'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  updateWorkspace,
  updateWorkspaceSchema,
  useWorkspaceQuery,
  workspaceKeys,
} from '@/domains/workspace';

import { useWorkspace } from './workspace-provider';

export function WorkspaceSettingsPanel() {
  const { workspaceId } = useWorkspace();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const updateWorkspaceMutation = useMutation({
    mutationFn: ({
      version,
      name,
      description,
      slug,
    }: {
      version: number;
      name?: string;
      slug?: string;
      description?: string;
    }) =>
      updateWorkspace(workspaceId, {
        version,
        ...(name ? { name } : {}),
        ...(slug ? { slug } : {}),
        ...(description !== undefined ? { description } : {}),
      }),
    onSuccess: async (workspace) => {
      setErrorMessage(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workspaceKeys.detail(workspaceId),
        }),
        queryClient.invalidateQueries({
          queryKey: workspaceKeys.lists(),
        }),
      ]);
      router.replace(`/${workspace.slug}/settings`);
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Could not update workspace.');
    },
  });

  if (workspaceQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading workspace settings...</p>;
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Workspace unavailable</h3>
        <p className="text-sm text-muted-foreground">
          The workspace settings panel could not load workspace data for this session.
        </p>
      </section>
    );
  }

  const workspace = workspaceQuery.data;
  const canEditWorkspace = workspace.current_user_role === 'owner' || workspace.current_user_role === 'admin';

  function handleUpdateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get('name') ?? '').trim();
    const nextSlug = String(formData.get('slug') ?? '').trim();
    const nextDescription = String(formData.get('description') ?? '').trim();
    const parsed = updateWorkspaceSchema.safeParse({
      version: workspace.version,
      name: nextName,
      slug: nextSlug,
      description: nextDescription,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Could not update workspace.');
      return;
    }

    setErrorMessage(null);
    updateWorkspaceMutation.mutate(parsed.data);
  }

  return (
    <section className="rounded-2xl border bg-muted/20 p-5">
      <div className="space-y-1">
        <p className="text-sm font-medium">General</p>
        <p className="text-sm text-muted-foreground">
          Current role: <span className="font-mono">{workspace.current_user_role}</span>
        </p>
      </div>
      <form className="mt-4 space-y-4" onSubmit={handleUpdateWorkspace}>
        <div className="space-y-2">
          <Label htmlFor="workspace-settings-name">Name</Label>
          <Input
            id="workspace-settings-name"
            name="name"
            defaultValue={workspace.name}
            disabled={!canEditWorkspace || updateWorkspaceMutation.isPending}
            minLength={2}
            maxLength={80}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workspace-settings-slug">Domain</Label>
          <Input
            id="workspace-settings-slug"
            name="slug"
            defaultValue={workspace.slug}
            disabled={!canEditWorkspace || updateWorkspaceMutation.isPending}
            minLength={3}
            maxLength={32}
            required
          />
          <p className="text-xs text-muted-foreground">
            Opens at <span className="font-mono">/{workspace.slug}</span>
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="workspace-settings-description">Description</Label>
          <textarea
            id="workspace-settings-description"
            name="description"
            defaultValue={workspace.description ?? ''}
            disabled={!canEditWorkspace || updateWorkspaceMutation.isPending}
            maxLength={280}
            className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Workspace id: <span className="font-mono">{workspace.id}</span></p>
          <p>Updated: {new Date(workspace.updated_at).toLocaleString()}</p>
        </div>
        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        {canEditWorkspace
          ? (
            <Button disabled={updateWorkspaceMutation.isPending} type="submit">
              {updateWorkspaceMutation.isPending ? 'Saving...' : 'Save workspace'}
            </Button>
          )
          : (
            <p className="text-sm text-muted-foreground">
              Members can view workspace settings, but only admins and owners can update them.
            </p>
          )}
      </form>
    </section>
  );
}
