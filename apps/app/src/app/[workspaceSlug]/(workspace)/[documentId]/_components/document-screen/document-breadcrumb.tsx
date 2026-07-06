"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useState } from "react";

import {
  documentDetailQueryOptions,
  documentKeys,
  getDocument,
  type Document,
} from "@/domains/document";
import { workspaceRoutes } from "@/domains/workspace";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type DocumentBreadcrumbProps = {
  document: Document;
  displayTitle: string;
  isVisible: boolean;
  workspaceSlug: string;
};

export function DocumentBreadcrumb({
  document,
  displayTitle,
  isVisible,
  workspaceSlug,
}: DocumentBreadcrumbProps) {
  const queryClient = useQueryClient();
  const [breadcrumbDocuments, setBreadcrumbDocuments] = useState<Document[]>([
    document,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadBreadcrumbDocuments() {
      const ancestors: Document[] = [];
      const visitedDocumentIds = new Set([document.id]);
      let parentDocumentId = document.parent_document_id;

      while (parentDocumentId && !visitedDocumentIds.has(parentDocumentId)) {
        visitedDocumentIds.add(parentDocumentId);

        const cachedParentDocument = queryClient.getQueryData<Document>(
          documentKeys.detail(parentDocumentId),
        );
        const parentDocument =
          cachedParentDocument ?? (await getDocument(parentDocumentId));

        queryClient.setQueryData(
          documentDetailQueryOptions(parentDocumentId).queryKey,
          parentDocument,
        );
        ancestors.push(parentDocument);
        parentDocumentId = parentDocument.parent_document_id;
      }

      if (!cancelled) {
        setBreadcrumbDocuments([...ancestors.reverse(), document]);
      }
    }

    void loadBreadcrumbDocuments();

    return () => {
      cancelled = true;
    };
  }, [document, queryClient]);

  const resolvedBreadcrumbDocuments =
    breadcrumbDocuments[breadcrumbDocuments.length - 1]?.id === document.id
      ? breadcrumbDocuments
      : [document];
  const visibleBreadcrumbDocuments =
    resolvedBreadcrumbDocuments.length > 3
      ? [
          resolvedBreadcrumbDocuments[0],
          resolvedBreadcrumbDocuments[resolvedBreadcrumbDocuments.length - 2],
          resolvedBreadcrumbDocuments[resolvedBreadcrumbDocuments.length - 1],
        ]
      : resolvedBreadcrumbDocuments;
  const breadcrumbLabelClassName =
    "block max-w-[7rem] truncate rounded px-1.5 sm:max-w-[9rem] lg:max-w-[11rem]";

  return (
    <Breadcrumb
      className={[
        "min-w-0 flex-1 transition-opacity duration-200",
        isVisible ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      <BreadcrumbList className="min-w-0 flex-nowrap gap-0.5 text-sm">
        {visibleBreadcrumbDocuments.map((breadcrumbDocument, index) => {
          const isCurrentDocument = breadcrumbDocument.id === document.id;
          const showEllipsis =
            resolvedBreadcrumbDocuments.length > 3 && index === 1;

          return (
            <Fragment key={breadcrumbDocument.id}>
              {index > 0 && (
                <BreadcrumbSeparator className="hidden text-muted-foreground/60 md:inline-flex">
                  /
                </BreadcrumbSeparator>
              )}
              {showEllipsis && (
                <>
                  <BreadcrumbItem className="px-1">...</BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden text-muted-foreground/60 md:inline-flex">
                    /
                  </BreadcrumbSeparator>
                </>
              )}
              <BreadcrumbItem className="min-w-0">
                {isCurrentDocument ? (
                  <BreadcrumbPage
                    className={`${breadcrumbLabelClassName} max-w-[8rem] py-1 sm:max-w-[10rem] lg:max-w-[12rem]`}
                  >
                    {displayTitle}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={
                      <Link
                        href={workspaceRoutes.document(
                          workspaceSlug,
                          breadcrumbDocument.public_id,
                          breadcrumbDocument.title,
                        )}
                        prefetch={false}
                      />
                    }
                    className={`${breadcrumbLabelClassName} hover:bg-accent hover:text-foreground`}
                  >
                    {breadcrumbDocument.title}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
