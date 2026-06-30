'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { createDocument, documentKeys } from '@/domains/document';
import { workspaceRoutes } from '@/domains/workspace';

import { CollapsibleSidebarGroup } from './collapsible-sidebar-group';
import { DocumentTree } from '../document-tree/document-tree';

export function PrivateDocumentsGroup({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createDocumentMutation = useMutation({
    mutationFn: () => createDocument({ workspace_id: workspaceId }),
    onSuccess: async (document) => {
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceId),
      });
      router.push(workspaceRoutes.document(workspaceId, document.id));
    },
  });

  return (
    <CollapsibleSidebarGroup
      label="Private"
      actions={(
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-sidebar-foreground/70 hover:text-sidebar-accent-foreground cursor-pointer"
            aria-label="Create private document"
            onClick={() => {
              void createDocumentMutation.mutateAsync();
            }}
            disabled={createDocumentMutation.isPending}
          >
            <PlusIcon className='size-4'/>
          </Button>
        </>
      )}
    >
      <DocumentTree workspaceId={workspaceId} />
    </CollapsibleSidebarGroup>
  );
}
