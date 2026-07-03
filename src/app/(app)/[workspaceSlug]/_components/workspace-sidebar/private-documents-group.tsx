'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { createDocument, documentKeys } from '@/domains/document';
import { workspaceRoutes } from '@/domains/workspace';

import { CollapsibleSidebarGroup } from './collapsible-sidebar-group';
import { DocumentTree } from '../document-tree/document-tree';

export function PrivateDocumentsGroup({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createDocumentMutation = useMutation({
    mutationFn: () => createDocument({ workspace_id: workspaceSlug }),
    onSuccess: async (document) => {
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
      router.push(workspaceRoutes.document(workspaceSlug, document.public_id, document.title));
    },
  });

  const createPrivateDocumentButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
      aria-label="Create private document"
      onClick={() => {
        void createDocumentMutation.mutateAsync();
      }}
      disabled={createDocumentMutation.isPending}
    >
      <PlusIcon className="size-4" />
    </Button>
  );

  return (
    <CollapsibleSidebarGroup
      label="Private"
      actions={(
        <Tooltip>
          <TooltipTrigger delay={0} render={createPrivateDocumentButton} />
          <TooltipContent side='bottom' >Create private document</TooltipContent>
        </Tooltip>
      )}
    >
      <DocumentTree workspaceSlug={workspaceSlug} />
    </CollapsibleSidebarGroup>
  );
}
