'use client';

import Link from 'next/link';
import { ChevronRightIcon, FileIcon, FileTextIcon } from 'lucide-react';

import {
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  type DocumentNavigationNode,
  useWorkspaceDocumentChildrenQuery,
} from '@shared/domains/document';
import {
  parseDocumentRouteSegment,
  workspaceRoutes,
} from '@shared/domains/workspace';
import { useDocumentTreeExpansionStore } from '@/stores/document-tree-expansion-store';
import { useDocumentTitleDraftStore } from '@/stores/document-title-draft-store';

import { DocumentTreeNodeActions } from './document-tree-node-actions/document-tree-node-actions';

export function DocumentTreeNode({
  document,
  workspaceSlug,
  pathname,
}: {
  document: DocumentNavigationNode;
  workspaceSlug: string;
  pathname: string;
}) {
  const href = workspaceRoutes.document(
    workspaceSlug,
    document.public_id,
    document.title,
  );
  const currentDocumentRouteId = parseDocumentRouteSegment(
    pathname.split('/').filter(Boolean).at(-1) ?? '',
  );
  const isActive =
    currentDocumentRouteId === document.public_id
    || currentDocumentRouteId === document.id;

  const hasChildren = document.has_children;
  const hasContent = document.has_content;
  const DocumentIcon = hasContent ? FileTextIcon : FileIcon;
  const activeDraftDocumentId = useDocumentTitleDraftStore(
    (state) => state.activeDocumentId,
  );
  const activeDraftTitle = useDocumentTitleDraftStore(
    (state) => state.draftTitle,
  );
  const expandedByWorkspace = useDocumentTreeExpansionStore(
    (state) => state.expandedByWorkspace,
  );
  const isExpanded =
    expandedByWorkspace[workspaceSlug]?.includes(document.id) ?? false;

  const toggleExpandedDocumentId = useDocumentTreeExpansionStore(
    (state) => state.toggleExpandedDocumentId,
  );

  const childrenQuery = useWorkspaceDocumentChildrenQuery(
    workspaceSlug,
    document.id,
    {
      enabled: hasChildren && isExpanded,
    },
  );
  const orderedChildDocuments = [...(childrenQuery.data?.items ?? [])].sort(
    (left, right) => right.sort_key - left.sort_key,
  );

  const displayTitle =
    document.id === activeDraftDocumentId && activeDraftTitle !== null
      ? activeDraftTitle
      : document.title;

  return (
    <SidebarMenuItem>
      <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-0 py-0">
        <SidebarMenuSubItem>
          <SidebarMenuSubButton
            render={<Link href={href} />}
            isActive={isActive}
            className="pr-14 group-hover/menu-sub-item:bg-sidebar-accent group-hover/menu-sub-item:text-sidebar-accent-foreground group-focus-within/menu-sub-item:bg-sidebar-accent group-focus-within/menu-sub-item:text-sidebar-accent-foreground"
          >
            {hasChildren
              ? (
                <span className="relative flex size-4 shrink-0 items-center justify-center">
                  <DocumentIcon className="absolute inset-0 size-4 transition-opacity group-hover/menu-sub-item:opacity-0" />
                  <button
                    type="button"
                    aria-label={
                      isExpanded
                        ? 'Collapse document children'
                        : 'Expand document children'
                    }
                    aria-expanded={isExpanded}
                    className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-transparent text-sidebar-foreground/70 opacity-0 transition-all hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring group-hover/menu-sub-item:bg-sidebar-accent/70 group-hover/menu-sub-item:text-sidebar-accent-foreground group-hover/menu-sub-item:opacity-100"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleExpandedDocumentId(workspaceSlug, document.id);
                    }}
                  >
                    <ChevronRightIcon
                      className={`pointer-events-none size-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                </span>
              )
              : (
                <DocumentIcon />
              )}
            <span className="font-semibold">{displayTitle}</span>
          </SidebarMenuSubButton>

          <DocumentTreeNodeActions
            document={document}
            isActive={isActive}
            workspaceSlug={workspaceSlug}
          />
        </SidebarMenuSubItem>

        {hasChildren && isExpanded && (
          <SidebarMenuSub className="mr-0 pr-0">
            {childrenQuery.isLoading
              ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon textWidth="68%" />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon textWidth="52%" />
                  </SidebarMenuItem>
                </>
              )
              : null}

            {orderedChildDocuments.map((childDocument) => (
              <DocumentTreeNode
                key={childDocument.id}
                document={childDocument}
                workspaceSlug={workspaceSlug}
                pathname={pathname}
              />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuSub>
    </SidebarMenuItem>
  );
}
