'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  documentKeys,
  getLastValidDocumentRoute,
  setLastValidDocumentRoute,
  type DocumentId,
  useDocumentQuery,
} from '@/domains/document';
import { useQueryClient } from '@tanstack/react-query';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@shared/components/ui/empty';
import { Button } from '@shared/components/ui/button';
import { ServerCrashIcon } from 'lucide-react';

import { DocumentScreen } from './document-screen/document-screen';
import { DocumentScreenSkeleton } from '../../../_components/workspace-skeleton/document-screen-skeleton';
import { workspaceRoutes } from '@/domains/workspace';

export function DocumentRouteScreen({
  documentId: documentRouteId,
  workspaceSlug,
}: {
  documentId: string;
  workspaceSlug: string;
}) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const router = useRouter();

  const routeDocumentQuery = useDocumentQuery(documentRouteId, {
    refetchOnMount: false,
  });

  const canonicalDocumentId = routeDocumentQuery.data?.id;

  const isCanonicalDocumentQueryEnabled =
    canonicalDocumentId !== undefined
    && canonicalDocumentId !== documentRouteId;

  const canonicalDocumentQuery = useDocumentQuery(
    (canonicalDocumentId ?? documentRouteId) as DocumentId,
    {
      enabled: isCanonicalDocumentQueryEnabled,
      initialData: routeDocumentQuery.data,
      refetchOnMount: false,
    },
  );

  const document = canonicalDocumentQuery.data ?? routeDocumentQuery.data;

  useEffect(() => {
    if (!document) {
      return;
    }

    queryClient.setQueryData(documentKeys.detail(document.id), document);
    queryClient.setQueryData(documentKeys.detail(document.public_id), document);

    setLastValidDocumentRoute(
      workspaceRoutes.document(workspaceSlug, document.public_id, document.title),
    );
  }, [document, queryClient, workspaceSlug]);

  useEffect(() => {
    if (
      document
      || routeDocumentQuery.isPending
      || (isCanonicalDocumentQueryEnabled && canonicalDocumentQuery.isPending)
      || (
        !routeDocumentQuery.isError
        && (!isCanonicalDocumentQueryEnabled || !canonicalDocumentQuery.isError)
      )
    ) {
      return;
    }

    router.replace(getLastValidDocumentRoute(pathname) ?? workspaceRoutes.entry());
  }, [
    canonicalDocumentQuery.isError,
    canonicalDocumentQuery.isPending,
    document,
    isCanonicalDocumentQueryEnabled,
    pathname,
    routeDocumentQuery.isError,
    routeDocumentQuery.isPending,
    router,
  ]);

  if (
    !document
    && (
      routeDocumentQuery.isPending
      || (isCanonicalDocumentQueryEnabled && canonicalDocumentQuery.isPending)
    )
  ) {
    return <DocumentScreenSkeleton animate />;
  }

  if (!document) {
    return (
      <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10 sm:px-6">
        <Empty className="max-w-xl bg-background">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ServerCrashIcon />
            </EmptyMedia>
            <EmptyTitle className="text-base">
              This document could not be loaded
            </EmptyTitle>
            <EmptyDescription>
              Try again first. If it keeps happening, the request is likely failing before the editor can hydrate.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="max-w-md gap-3">
            <Button
              type="button"
              className="w-1/2"
              size="lg"
              onClick={() => {
                void routeDocumentQuery.refetch();
              }}
            >
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      </section>
    );
  }

  return (
    <DocumentScreen
      document={document}
      workspaceSlug={workspaceSlug}
    />
  );
}
