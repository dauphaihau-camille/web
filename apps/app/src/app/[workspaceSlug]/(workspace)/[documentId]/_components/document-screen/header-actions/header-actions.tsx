"use client";

import { LinkIcon, StarIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/components/ui/tooltip";
import type { Document } from "@shared/domains/document";
import { cn } from "@shared/lib/utils";

import { DocOperations } from "./doc-operations";
import { RelativeTimeText } from "./relative-time-text";
import { ShareButton } from "./share-button";

type HeaderActionsProps = {
  archiveCurrentDocument: () => void;
  copyLink: () => void | Promise<void>;
  copyPublishedLink: () => Promise<void>;
  duplicateDocument: () => void;
  favoriteStatus?: {
    is_favorite: boolean;
  };
  isArchiving: boolean;
  isDuplicating: boolean;
  isFavoriting: boolean;
  isVisible?: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  publishCurrentDocument: () => void;
  publishStatus?: {
    public_path?: string;
    published_document_id?: string;
  };
  toggleFavorite: () => void;
  unpublishCurrentDocument: () => void;
  updatedAt: Document["updated_at"];
};

export function HeaderActions({
  archiveCurrentDocument,
  copyLink,
  copyPublishedLink,
  duplicateDocument,
  favoriteStatus,
  isArchiving,
  isDuplicating,
  isFavoriting,
  isVisible = true,
  isPublishing,
  isUnpublishing,
  publishCurrentDocument,
  publishStatus,
  toggleFavorite,
  unpublishCurrentDocument,
  updatedAt,
}: HeaderActionsProps) {
  return (
    <div
      className={cn(
        "shrink-0 flex items-center transition-opacity duration-200",
        isVisible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex mr-2">
        <RelativeTimeText
          fallback="recently"
          prefix="Edited"
          value={updatedAt}
        />
      </div>
      <ShareButton
        isPublished={Boolean(publishStatus?.published_document_id)}
        isPublishing={isPublishing}
        isUnpublishing={isUnpublishing}
        publishedPath={publishStatus?.public_path}
        onCopyPublishedLink={copyPublishedLink}
        onPublish={publishCurrentDocument}
        onUnpublish={unpublishCurrentDocument}
      />
      <HeaderActionButton
        ariaLabel="Copy link"
        icon={<LinkIcon className="size-4" />}
        onClick={copyLink}
        tooltip="Copy link"
      />
      <HeaderActionButton
        ariaLabel="Favorite document"
        icon={
          <StarIcon
            className={cn(
              "size-4",
              favoriteStatus?.is_favorite ? "fill-current text-amber-300" : "",
            )}
          />
        }
        disabled={isFavoriting}
        onClick={toggleFavorite}
        tooltip={
          favoriteStatus?.is_favorite
            ? "Remove from favorites"
            : "Add to favorites"
        }
      />
      <DocOperations
        isArchiving={isArchiving}
        isDuplicating={isDuplicating}
        updatedAt={updatedAt}
        onArchive={archiveCurrentDocument}
        onCopyLink={copyLink}
        onDuplicate={duplicateDocument}
      />
    </div>
  );
}

function HeaderActionButton({
  ariaLabel,
  disabled = false,
  icon,
  onClick,
  tooltip,
}: {
  ariaLabel: string;
  disabled?: boolean;
  icon: ReactNode;
  onClick?: () => void | Promise<void>;
  tooltip?: ReactNode;
}) {
  const button = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      className={cn(
        "text-muted-foreground",
        disabled && "pointer-events-none opacity-50",
      )}
      onClick={() => {
        void onClick?.();
      }}
    >
      {icon}
    </Button>
  );

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger delay={0} render={button} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
