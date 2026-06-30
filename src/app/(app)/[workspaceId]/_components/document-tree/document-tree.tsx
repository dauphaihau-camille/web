'use client';

import { usePathname } from 'next/navigation';

import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { useWorkspaceDocumentRootQuery } from '@/domains/document';

import { CreateTeamspaceDocumentButton } from './create-teamspace-document-button';
import {
  DocumentTreeLoading,
  TeamspaceDocumentTreeLoading,
} from './document-tree-loading';
import { DocumentTreeMoreButton } from './document-tree-more-button';
import { DocumentTreeNode } from './document-tree-node';

export function DocumentTree({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const pathname = usePathname();
  const rootQuery = useWorkspaceDocumentRootQuery(workspaceId);

  if (rootQuery.isLoading) {
    return <DocumentTreeLoading />;
  }

  if (rootQuery.isError || !rootQuery.data) {
    return <p className="px-2 py-1 text-xs text-muted-foreground">Documents unavailable.</p>;
  }

  return (
    <div>
      <SidebarMenu className="space-y-0.5">
        {rootQuery.data.private_documents.items.length === 0
          ? (
            <SidebarMenuItem>
              <p className="px-2 py-1 text-xs text-muted-foreground">No private documents yet.</p>
            </SidebarMenuItem>
          )
          : (
            rootQuery.data.private_documents.items.map((document) => (
              <DocumentTreeNode
                key={document.id}
                document={document}
                workspaceId={workspaceId}
                pathname={pathname}
              />
            ))
          )}
        {rootQuery.data.private_documents.next_cursor
          ? (
            <DocumentTreeMoreButton
              workspaceId={workspaceId}
              initialCursor={rootQuery.data.private_documents.next_cursor}
            />
          )
          : null}
      </SidebarMenu>
    </div>
  );
}

export function TeamspaceDocumentTree({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const pathname = usePathname();
  const rootQuery = useWorkspaceDocumentRootQuery(workspaceId);

  if (rootQuery.isLoading) {
    return <TeamspaceDocumentTreeLoading />;
  }

  if (rootQuery.isError || !rootQuery.data) {
    return <p className="px-2 py-1 text-xs text-muted-foreground">Teamspaces unavailable.</p>;
  }

  return (
    <div className="space-y-3">
      {rootQuery.data.teamspaces.length === 0
        ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">No teamspaces yet.</p>
        )
        : (
          rootQuery.data.teamspaces.map((teamspace) => (
            <div key={teamspace.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2 px-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {teamspace.name}
                </p>
                <CreateTeamspaceDocumentButton
                  workspaceId={workspaceId}
                  teamspaceId={teamspace.id}
                />
              </div>
              <SidebarMenu>
                {teamspace.documents.items.length === 0
                  ? (
                    <SidebarMenuItem>
                      <p className="px-2 py-1 text-xs text-muted-foreground">
                        No shared documents.
                      </p>
                    </SidebarMenuItem>
                  )
                  : (
                    teamspace.documents.items.map((document) => (
                      <DocumentTreeNode
                        key={document.id}
                        document={document}
                        workspaceId={workspaceId}
                        pathname={pathname}
                      />
                    ))
                  )}
              </SidebarMenu>
            </div>
          ))
        )}
    </div>
  );
}
