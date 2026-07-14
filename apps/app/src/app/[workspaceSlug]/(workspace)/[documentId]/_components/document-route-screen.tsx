'use client';

import { useEffect } from 'react';
import {
  documentKeys,
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
import { DocumentScreenSkeleton } from './document-screen-skeleton';

export function DocumentRouteScreen({
  documentId: documentRouteId,
  workspaceSlug,
}: {
  documentId: string;
  workspaceSlug: string;
}) {
  const queryClient = useQueryClient();
  const routeDocumentQuery = useDocumentQuery(documentRouteId, {
    refetchOnMount: false,
  });
  const canonicalDocumentId = routeDocumentQuery.data?.id;
  const canonicalDocumentQuery = useDocumentQuery(
    (canonicalDocumentId ?? documentRouteId) as DocumentId,
    {
      enabled:
        canonicalDocumentId !== undefined
        && canonicalDocumentId !== documentRouteId,
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
  }, [document, queryClient]);

  if (!document && (routeDocumentQuery.isPending || canonicalDocumentQuery.isPending)) {
    return <DocumentScreenSkeleton />;
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
