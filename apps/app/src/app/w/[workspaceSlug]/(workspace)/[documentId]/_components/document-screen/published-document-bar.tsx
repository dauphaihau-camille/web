'use client';

import Link from 'next/link';
import { Globe2Icon } from 'lucide-react';

import { buttonVariants } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import { buildPublishedDocumentUrl } from './document-toolbar/document-toolbar.utils';

export function PublishedDocumentBar({
  publishedPath,
  offsetTop = 0,
}: {
  publishedPath?: string;
  offsetTop?: number;
}) {
  if (!publishedPath) {
    return null;
  }

  const publishedUrl = buildPublishedDocumentUrl(publishedPath);

  return (
    <div
      className="fixed inset-x-0 z-20 h-12 bg-sky-100/50 px-5 text-sky-700 dark:bg-sky-950 dark:text-sky-50 md:left-(--sidebar-width) md:right-[var(--workspace-right-rail-reserved-width,0rem)]"
      style={{ top: offsetTop }}
    >
      <div className="flex h-full items-center justify-center gap-3 text-center text-sm font-medium">
        <span>This page is live on the web.</span>
        <Link
          href={publishedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'h-8 gap-1 px-2 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:text-sky-200 dark:hover:bg-sky-800/80 dark:hover:text-sky-50',
          )}
        >
          <Globe2Icon className="size-4" />
          <span>View site</span>
        </Link>
      </div>
    </div>
  );
}
