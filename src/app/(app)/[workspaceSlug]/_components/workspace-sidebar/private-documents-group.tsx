'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { hasMeaningfulContent } from '@/components/editor/has-meaningful-content';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  createDocument,
  documentKeys,
  type Document,
  type DocumentNavigationNode,
  type WorkspaceDocumentNavigation,
} from '@/domains/document';
import { workspaceRoutes } from '@/domains/workspace';

import { CollapsibleSidebarGroup } from './collapsible-sidebar-group';
import { DocumentTree } from '../document-tree/document-tree';

function buildDocumentNavigationNode(document: Document): DocumentNavigationNode {
  return {
    id: document.id,
    public_id: document.public_id,
    title: document.title,
    teamspace_id: document.teamspace_id,
    parent_document_id: document.parent_document_id,
    sort_key: document.sort_key,
    has_children: false,
    has_content: hasMeaningfulContent(document.content),
  };
}

function isUnfilteredRootListKey(queryKey: readonly unknown[]) {
  return queryKey.at(-4) === 'root'
    && queryKey.at(-2) === null
    && queryKey.at(-1) === null;
}

function insertCreatedPrivateRootDocument(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceSlug: string,
  document: Document,
) {
  const documentNode = buildDocumentNavigationNode(document);

  for (const [queryKey, currentNavigation] of queryClient.getQueriesData<WorkspaceDocumentNavigation>({
    queryKey: [...documentKeys.lists(workspaceSlug), 'root'],
  })) {
    if (!currentNavigation || !isUnfilteredRootListKey(queryKey)) {
      continue;
    }

    queryClient.setQueryData<WorkspaceDocumentNavigation>(queryKey, {
      ...currentNavigation,
      private_documents: {
        ...currentNavigation.private_documents,
        items: [documentNode, ...currentNavigation.private_documents.items]
          .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
          .sort((left, right) => left.sort_key - right.sort_key),
      },
    });
  }
}

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
      router.push(workspaceRoutes.document(workspaceSlug, document.public_id, document.title));
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
      <PlusIcon className="size-4" />
    </Button>
  );

  return (
    <CollapsibleSidebarGroup
      label="Private"
      actions={(
        <Tooltip>
          <TooltipTrigger delay={0} render={createPrivateDocumentButton} />
          <TooltipContent side="bottom">Add a document</TooltipContent>
        </Tooltip>
      )}
    >
      <DocumentTree workspaceSlug={workspaceSlug} />
    </CollapsibleSidebarGroup>
  );
}
