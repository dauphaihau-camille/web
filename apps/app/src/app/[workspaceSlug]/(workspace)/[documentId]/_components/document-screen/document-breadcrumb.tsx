'use client';

import Link from 'next/link';
import { Fragment } from 'react';

import type {
  Document,
} from '@shared/domains/document';
import { workspaceRoutes } from '@shared/domains/workspace';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@shared/components/ui/breadcrumb';

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
  const resolvedBreadcrumbDocuments = [
    ...(document.breadcrumb ?? []),
    document,
  ];
  const visibleBreadcrumbDocuments =
    resolvedBreadcrumbDocuments.length > 3
      ? [
        resolvedBreadcrumbDocuments[0],
        resolvedBreadcrumbDocuments[resolvedBreadcrumbDocuments.length - 2],
        resolvedBreadcrumbDocuments[resolvedBreadcrumbDocuments.length - 1],
      ]
      : resolvedBreadcrumbDocuments;
  const breadcrumbLabelClassName =
    'block max-w-[7rem] truncate rounded px-1.5 sm:max-w-[9rem] lg:max-w-[11rem]';

  return (
    <Breadcrumb
      className={[
        'min-w-0 flex-1 transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
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
                {isCurrentDocument
                  ? (
                    <BreadcrumbPage
                      className={`${breadcrumbLabelClassName} max-w-[8rem] py-1 sm:max-w-[10rem] lg:max-w-[12rem]`}
                    >
                      {displayTitle}
                    </BreadcrumbPage>
                  )
                  : (
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
