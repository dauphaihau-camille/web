'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import type { useWorkspaceDocumentRootQuery } from '@/domains/document';

import { CreateDocumentButton } from '../create-document-button';
import { CollapsibleSidebarGroup } from './collapsible-sidebar-group';
import { useCreateRootDocumentAction } from './use-create-root-document-action';
import { DocumentTree } from '../document-tree/document-tree';

export function PrivateDocumentsGroup({
  workspaceSlug,
  rootQuery,
}: {
  workspaceSlug: string;
  rootQuery?: ReturnType<typeof useWorkspaceDocumentRootQuery>;
}) {
  const {
    createDocumentMutation,
    handleCreateDocument,
  } = useCreateRootDocumentAction(workspaceSlug);

  return (
    <>
      <CollapsibleSidebarGroup
        label="Private"
        actions={
          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={
                <CreateDocumentButton
                  ariaLabel="Create private document"
                  onClick={handleCreateDocument}
                  disabled={createDocumentMutation.isPending}
                  isPending={createDocumentMutation.isPending}
                />
              }
            />
            <TooltipContent side="bottom">Add a document</TooltipContent>
          </Tooltip>
        }
      >
        <DocumentTree workspaceSlug={workspaceSlug} rootQuery={rootQuery} />
      </CollapsibleSidebarGroup>
    </>
  );
}
