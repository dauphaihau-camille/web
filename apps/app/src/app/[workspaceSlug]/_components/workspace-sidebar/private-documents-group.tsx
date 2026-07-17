'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingIcon } from '@shared/components/loading-icon';
import { Button } from '@shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import {
  createDocument,
  documentKeys,
} from '@/domains/document';
import { insertCreatedPrivateRootDocument } from '@/domains/document/cache/document-query-cache';
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
      queryClient.setQueryData(documentKeys.detail(document.id), document);
      insertCreatedPrivateRootDocument(queryClient, workspaceSlug, document);
      router.push(
        workspaceRoutes.document(
          workspaceSlug,
          document.public_id,
          document.title,
        ),
      );
    },
  });

  const createPrivateDocumentButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="size-5 rounded-sm bg-transparent text-sidebar-foreground/70 hover:!bg-sidebar-accent-foreground/5 hover:text-sidebar-accent-foreground"
      aria-label="Create private document"
      onClick={() => {
        void createDocumentMutation.mutateAsync();
      }}
      disabled={createDocumentMutation.isPending}
    >
      {createDocumentMutation.isPending
        ? (
          <LoadingIcon className="size-3" />
        )
        : (
          <PlusIcon className="size-4" />
        )}
    </Button>
  );

  return (
    <>
      <CollapsibleSidebarGroup
        label="Private"
        actions={
          <Tooltip>
            <TooltipTrigger delay={0} render={createPrivateDocumentButton} />
            <TooltipContent side="bottom">Add a document</TooltipContent>
          </Tooltip>
        }
      >
        <DocumentTree workspaceSlug={workspaceSlug} />
      </CollapsibleSidebarGroup>
    </>
  );
}
