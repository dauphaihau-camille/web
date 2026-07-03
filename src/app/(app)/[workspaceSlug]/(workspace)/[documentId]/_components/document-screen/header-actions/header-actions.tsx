'use client';

import {
  LinkIcon,
  StarIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Document } from '@/domains/document';
import { cn } from '@/lib/utils';

import { formatRelativeTime } from './header-actions.utils';
import { PageOperations } from './page-operations';
import { ShareButton } from './share-button';
import { useHeaderActions } from './use-header-actions';

type HeaderActionsProps = {
  workspaceSlug: string;
  document: Document;
  isVisible?: boolean;
};

export function HeaderActions({
  workspaceSlug,
  document,
  isVisible = true,
}: HeaderActionsProps) {
  const {
    archiveCurrentDocument,
    copyLink,
    copyPublishedLink,
    duplicateDocument,
    favoriteStatus,
    isFavoriting,
    isArchiving,
    isDuplicating,
    isPublishing,
    isUnpublishing,
    publishCurrentDocument,
    publishStatus,
    toggleFavorite,
    unpublishCurrentDocument,
  } = useHeaderActions({
    workspaceSlug,
    document,
  });

  return (
    <div
      className={cn(
        'shrink-0 flex items-center transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex mr-2">
        <span>Edited {formatRelativeTime(document.updated_at)}</span>
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
      <PageOperations
        isArchiving={isArchiving}
        isDuplicating={isDuplicating}
        updatedAt={document.updated_at}
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
