import { useKeyPress } from 'ahooks';
import {
  Building2Icon,
  LockIcon,
  UsersIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { OPEN_SHARE_EVENT } from '@/app/[workspaceSlug]/_components/workspace-shortcuts-provider';
import type { Document } from '@/domains/document';
import {
  buttonVariants,
} from '@shared/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import { cn } from '@shared/lib/utils';

import { buildPublishedDocumentUrl } from '../document-toolbar.utils';
import { SharePopoverContent } from './share-popover-content';
import type { ShareButtonProps } from './types';

const SHARE_SHORTCUT = '\u21e7\u2318S';
const COPY_PUBLISHED_LINK_SHORTCUT = '\u21e7\u2318C';

function renderShareTriggerIcon(document: Document) {
  const scope = document.access?.scope ?? (
    document.teamspace_id ? 'teamspace' : 'private'
  );

  if (scope === 'shared') {
    return <UsersIcon className="size-3.5" aria-hidden="true" />;
  }

  if (scope === 'teamspace') {
    return <Building2Icon className="size-3.5" aria-hidden="true" />;
  }

  return <LockIcon className="size-3.5" aria-hidden="true" />;
}

export function ShareButton({
  canManageAccess,
  canEdit,
  document,
  isArchived,
  isPublished,
  isPublishing,
  isRestoring,
  isUnpublishing,
  publishedPath,
  triggerClassName,
  workspaceSlug,
  onCopyLink,
  onCopyPublishedLink,
  onOpenChange,
  onPublish,
  onRestore,
  onUnpublish,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const publicUrl = buildPublishedDocumentUrl(publishedPath);
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  }, [onOpenChange]);

  useEffect(() => {
    const handleOpenShare = () => {
      handleOpenChange(!isOpen);
    };

    window.addEventListener(OPEN_SHARE_EVENT, handleOpenShare);

    return () => {
      window.removeEventListener(OPEN_SHARE_EVENT, handleOpenShare);
    };
  }, [handleOpenChange, isOpen]);

  useKeyPress(
    'meta.shift.c',
    (event) => {
      if (!isPublished) {
        return;
      }

      event.preventDefault();
      void onCopyPublishedLink();
    },
    {
      exactMatch: true,
    },
  );

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'gap-1.5 px-2 text-[14px] h-7 text-muted-foreground rounded-sm',
                triggerClassName,
              )}
            >
              {renderShareTriggerIcon(document)}
              Share
            </PopoverTrigger>
          }
        />
        <TooltipContent>
          <span>Share and publish</span>
          <Kbd>{SHARE_SHORTCUT}</Kbd>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-104 gap-0 overflow-hidden p-0"
      >
        <SharePopoverContent
          canManageAccess={canManageAccess}
          document={document}
          isArchived={isArchived}
          workspaceSlug={workspaceSlug}
          onCopyLink={onCopyLink}
          canEdit={canEdit}
          isPublished={isPublished}
          isPublishing={isPublishing}
          isRestoring={isRestoring}
          isUnpublishing={isUnpublishing}
          publicUrl={publicUrl}
          onCopyPublishedLink={onCopyPublishedLink}
          onPublish={onPublish}
          onRestore={onRestore}
          onUnpublish={onUnpublish}
          copyPublishedLinkShortcut={COPY_PUBLISHED_LINK_SHORTCUT}
        />
      </PopoverContent>
    </Popover>
  );
}
