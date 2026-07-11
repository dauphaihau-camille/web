'use client';

import { LinkIcon, StarIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import type { Document } from '@/domains/document';
import { cn } from '@shared/lib/utils';

import { DocOperations } from './doc-operations/doc-operations';
import { RelativeTimeText } from './doc-operations/relative-time-text';
import { ShareButton } from './share-button/share-button';

type DocumentToolbarProps = {
  archiveCurrentDocument: () => void;
  copyLink: () => void | Promise<void>;
  copyPublishedLink: () => Promise<void>;
  duplicateDocument: () => void;
  favoriteStatus?: {
    is_favorite: boolean;
  };
  isArchiving: boolean;
  isArchived?: boolean;
  isDuplicating: boolean;
  isFavoriting: boolean;
  isRestoring?: boolean;
  isVisible?: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  publishCurrentDocument: () => void;
  publishStatus?: {
    public_path?: string;
    published_document_id?: string;
  };
  restoreCurrentDocument: () => void;
  toggleFavorite: () => void;
  unpublishCurrentDocument: () => void;
  updatedAt: Document['updated_at'];
};

export function DocumentToolbar({
  archiveCurrentDocument,
  copyLink,
  copyPublishedLink,
  duplicateDocument,
  favoriteStatus,
  isArchiving,
  isArchived = false,
  isDuplicating,
  isFavoriting,
  isRestoring = false,
  isVisible = true,
  isPublishing,
  isUnpublishing,
  publishCurrentDocument,
  publishStatus,
  restoreCurrentDocument,
  toggleFavorite,
  unpublishCurrentDocument,
  updatedAt,
}: DocumentToolbarProps) {
  return (
    <div
      className={cn(
        'shrink-0 flex items-center transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
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
        isArchived={isArchived}
        isPublished={Boolean(publishStatus?.published_document_id)}
        isPublishing={isPublishing}
        isRestoring={isRestoring}
        isUnpublishing={isUnpublishing}
        publishedPath={publishStatus?.public_path}
        onCopyPublishedLink={copyPublishedLink}
        onPublish={publishCurrentDocument}
        onRestore={restoreCurrentDocument}
        onUnpublish={unpublishCurrentDocument}
      />
      <ToolbarActionButton
        ariaLabel="Copy link"
        icon={<LinkIcon className="size-4" />}
        onClick={copyLink}
        tooltip="Copy link"
      />
      <ToolbarActionButton
        ariaLabel="Favorite document"
        icon={
          <StarIcon
            className={cn(
              'size-4',
              favoriteStatus?.is_favorite ? 'fill-current text-amber-300' : '',
            )}
          />
        }
        disabled={isFavoriting}
        onClick={toggleFavorite}
        tooltip={
          favoriteStatus?.is_favorite
            ? 'Remove from favorites'
            : 'Add to favorites'
        }
      />
      <DocOperations
        isArchiving={isArchiving}
        isArchived={isArchived}
        isDuplicating={isDuplicating}
        updatedAt={updatedAt}
        onArchive={archiveCurrentDocument}
        onCopyLink={copyLink}
        onDuplicate={duplicateDocument}
      />
    </div>
  );
}

function ToolbarActionButton({
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
        'text-muted-foreground',
        disabled && 'pointer-events-none opacity-50',
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
