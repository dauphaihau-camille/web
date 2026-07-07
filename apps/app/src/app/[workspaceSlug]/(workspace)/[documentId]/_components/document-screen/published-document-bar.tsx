"use client";

import Link from "next/link";
import { Globe2Icon } from "lucide-react";

import { buttonVariants } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";

export function PublishedDocumentBar({
  publishedPath,
}: {
  publishedPath?: string;
}) {
  if (!publishedPath) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-20 h-12 border-b border-sky-100 bg-sky-50/95 px-5 text-sky-700 backdrop-blur md:left-(--sidebar-width)">
      <div className="flex h-full items-center justify-center gap-3 text-center text-sm font-medium">
        <span>This page is live on the web.</span>
        <Link
          href={publishedPath}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-8 gap-1 px-2 text-sky-700 hover:bg-sky-100 hover:text-sky-800",
          )}
        >
          <Globe2Icon className="size-4" />
          <span>View site</span>
        </Link>
      </div>
    </div>
  );
}
