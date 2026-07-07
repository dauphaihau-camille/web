import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';

import { BlockNoteEditorLoader } from '@/components/editor/blocknote-editor-loader';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@shared/components/ui/breadcrumb';
import { buttonVariants } from '@shared/components/ui/button';
import { getPublicDocumentServer } from '@shared/domains/publish/api/publish.server.requests';
import { getAppSignupUrl } from '@/lib/app-url';
import { cn } from '@shared/lib/utils';

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { publishedDocumentId } = (await params) as {
    publishedDocumentId: string;
  };
  let document;

  try {
    document = await getPublicDocumentServer(publishedDocumentId);
  }
  catch (error) {
    if (isUnavailablePublicDocumentError(error)) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="min-h-svh px-5 py-12">
      <div className="fixed inset-x-0 top-0 z-10 bg-transparent px-2 backdrop-blur">
        <div className="mx-auto flex h-11 items-center justify-between gap-3 mt-1">
          <DocumentBreadcrumb
            title={document.title}
            breadcrumb={document.breadcrumb}
          />

          <Link
            href={getAppSignupUrl()}
            className={cn(buttonVariants({ size: 'lg' }), 'px-2.5 text-[13px]')}
          >
            Get Camille Free
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl pt-20">
        <div className="space-y-3 px-[3.8rem]">
          <h1 className="text-4xl font-semibold tracking-tight">
            {document.title}
          </h1>
        </div>
        <div className="pt-6">
          <BlockNoteEditorLoader
            documentTitle={document.title}
            content={document.content}
            workspaceSlug=""
            editable={false}
          />
        </div>
      </div>
    </main>
  );
}

function DocumentBreadcrumb({
  title,
  breadcrumb,
}: {
  title: string;
  breadcrumb: Array<{
    id: string;
    title: string;
    published_document_id: string;
    public_path: string;
  }>;
}) {
  const visibleBreadcrumb =
    breadcrumb.length > 0
      ? breadcrumb
      : [
        {
          id: '',
          title,
          published_document_id: '',
          public_path: '',
        },
      ];
  const breadcrumbLabelClassName =
    'block max-w-[7rem] truncate rounded px-1.5 sm:max-w-[9rem] lg:max-w-[11rem]';

  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbList className="min-w-0 flex-nowrap gap-0.5 text-sm">
        {visibleBreadcrumb.map((item, index) => {
          const isCurrent = index === visibleBreadcrumb.length - 1;

          return (
            <Fragment key={item.id || `${item.title}-${index}`}>
              {index > 0 && (
                <BreadcrumbSeparator className="text-muted-foreground/60">
                  /
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem className="min-w-0">
                {isCurrent
                  ? (
                    <BreadcrumbPage
                      className={cn(
                        breadcrumbLabelClassName,
                        'max-w-[8rem] py-1 sm:max-w-[10rem] lg:max-w-[12rem]',
                      )}
                    >
                      {item.title}
                    </BreadcrumbPage>
                  )
                  : (
                    <BreadcrumbLink
                      href={item.public_path}
                      className={cn(
                        breadcrumbLabelClassName,
                        'hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {item.title}
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

function isUnavailablePublicDocumentError(error: unknown) {
  return (
    error instanceof Error
    && (error.message.includes('Status: 403.')
      || error.message.includes('Status: 404.'))
  );
}
