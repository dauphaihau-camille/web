'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRightIcon, FileTextIcon } from 'lucide-react';

import {
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  type DocumentNavigationNode,
  useWorkspaceDocumentChildrenQuery,
} from '@/domains/document';
import { workspaceRoutes } from '@/domains/workspace';
import { useDocumentTitleDraftStore } from '@/stores/document-title-draft-store';

export function DocumentTreeNode({
  document,
  workspaceId,
  pathname,
}: {
  document: DocumentNavigationNode;
  workspaceId: string;
  pathname: string;
}) {
  const href = workspaceRoutes.document(workspaceId, document.id);
  const isActive = pathname === href;
  const hasChildren = document.has_children;
  const [isExpanded, setIsExpanded] = useState(false);
  const activeDraftDocumentId = useDocumentTitleDraftStore((state) => state.activeDocumentId);
  const activeDraftTitle = useDocumentTitleDraftStore((state) => state.draftTitle);
  const childrenQuery = useWorkspaceDocumentChildrenQuery(workspaceId, document.id, {
    enabled: hasChildren && isExpanded,
  });

  const displayTitle =
    isActive && document.id === activeDraftDocumentId && activeDraftTitle !== null
      ? activeDraftTitle
      : document.title;

  return (
    <SidebarMenuItem>
      <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-0 py-0">
        <SidebarMenuSubItem>
          <SidebarMenuSubButton
            render={<Link href={href} />}
            isActive={isActive}
            className="font-semibold"
          >
            {hasChildren
              ? (
                <span className="relative flex size-4 shrink-0 items-center justify-center">
                  <FileTextIcon className="absolute inset-0 size-4 transition-opacity group-hover/menu-sub-item:opacity-0" />
                  <button
                    type="button"
                    aria-label={isExpanded ? 'Collapse document children' : 'Expand document children'}
                    aria-expanded={isExpanded}
                    className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-transparent text-sidebar-foreground/70 opacity-0 transition-all hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring group-hover/menu-sub-item:bg-sidebar-accent/70 group-hover/menu-sub-item:text-sidebar-accent-foreground group-hover/menu-sub-item:opacity-100"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setIsExpanded((current) => !current);
                    }}
                  >
                    <ChevronRightIcon
                      className={`pointer-events-none size-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                </span>
              )
              : <FileTextIcon />}
            <span>{displayTitle}</span>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
        {hasChildren && isExpanded && (
          <SidebarMenuSub className="mr-0 pr-0">
            {childrenQuery.isLoading
              ? (
                <SidebarMenuItem>
                  <p className="px-2 py-1 text-xs text-muted-foreground">Loading...</p>
                </SidebarMenuItem>
              )
              : null}
            {childrenQuery.data?.items.map((childDocument) => (
              <DocumentTreeNode
                key={childDocument.id}
                document={childDocument}
                workspaceId={workspaceId}
                pathname={pathname}
              />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuSub>
    </SidebarMenuItem>
  );
}
