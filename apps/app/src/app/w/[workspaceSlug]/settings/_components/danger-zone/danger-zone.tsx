'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  deleteWorkspace,
  type Workspace,
  workspaceKeys,
  workspaceRoutes,
} from '@/domains/workspace';
import { Button } from '@shared/components/ui/button';
import { DeleteWorkspaceConfirmDialog } from './delete-workspace-confirm-dialog';
import { SettingsRow, SettingsSection } from '../settings-section';

export function DangerZone({
  workspace,
}: {
  workspace: Workspace;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const canDeleteWorkspace = workspace.current_user_role === 'owner';

  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => deleteWorkspace(workspace.id),
    onSuccess: async () => {
      setIsDeleteDialogOpen(false);
      queryClient.removeQueries({
        queryKey: workspaceKeys.detail(workspace.id),
      });
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.lists(),
      });
      router.replace(workspaceRoutes.entry());
      toast.success('Workspace deleted', {
        position: 'bottom-right',
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not delete workspace.',
        {
          position: 'bottom-right',
        },
      );
    },
  });

  return (
    <SettingsSection title="Danger zone">
      <SettingsRow
        title="Delete workspace"
        description="Permanently delete this workspace, including all pages and files."
        showDivider={false}
      >
        <Button
          disabled={!canDeleteWorkspace || deleteWorkspaceMutation.isPending}
          onClick={() => setIsDeleteDialogOpen(true)}
          variant="destructive"
        >
          Delete workspace
        </Button>
      </SettingsRow>

      <DeleteWorkspaceConfirmDialog
        isDeleting={deleteWorkspaceMutation.isPending}
        onConfirm={() => deleteWorkspaceMutation.mutate()}
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
        workspaceName={workspace.name}
      />
    </SettingsSection>
  );
}
