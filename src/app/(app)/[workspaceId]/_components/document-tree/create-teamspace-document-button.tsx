'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { createDocument, documentKeys } from '@/domains/document';
import { workspaceRoutes } from '@/domains/workspace';

export function CreateTeamspaceDocumentButton({
  workspaceId,
  teamspaceId,
}: {
  workspaceId: string;
  teamspaceId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createDocumentMutation = useMutation({
    mutationFn: () => createDocument({
      workspace_id: workspaceId,
      teamspace_id: teamspaceId,
    }),
    onSuccess: async (document) => {
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceId),
      });
      router.push(workspaceRoutes.document(workspaceId, document.id));
    },
  });

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 px-2 text-xs"
      onClick={() => {
        void createDocumentMutation.mutateAsync();
      }}
      disabled={createDocumentMutation.isPending}
    >
      New
    </Button>
  );
}
