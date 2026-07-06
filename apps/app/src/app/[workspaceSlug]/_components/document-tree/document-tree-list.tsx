"use client";

import { usePathname } from "next/navigation";

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { DocumentNavigationNode } from "@/domains/document";

import { DocumentTreeMoreButton } from "./document-tree-more-button";
import { DocumentTreeNode } from "./document-tree-node";

export function DocumentTreeList({
  workspaceSlug,
  items,
  emptyMessage,
  nextCursor,
}: {
  workspaceSlug: string;
  items: DocumentNavigationNode[];
  emptyMessage: string;
  nextCursor?: string;
}) {
  const pathname = usePathname();

  return (
    <div>
      <SidebarMenu className="space-y-0.5">
        {items.length === 0 ? (
          <SidebarMenuItem>
            <p className="px-2 py-1 text-xs text-muted-foreground">
              {emptyMessage}
            </p>
          </SidebarMenuItem>
        ) : (
          items.map((document) => (
            <DocumentTreeNode
              key={document.id}
              document={document}
              workspaceSlug={workspaceSlug}
              pathname={pathname}
            />
          ))
        )}
        {nextCursor ? (
          <DocumentTreeMoreButton
            workspaceSlug={workspaceSlug}
            initialCursor={nextCursor}
          />
        ) : null}
      </SidebarMenu>
    </div>
  );
}
