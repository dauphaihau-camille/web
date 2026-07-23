import { useKeyPress } from 'ahooks';
import {
  Building2Icon,
  LockIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import { cn } from '@shared/lib/utils';

import { buildPublishedDocumentUrl } from '../document-toolbar.utils';
import { PublishTabContent } from './publish-tab-content';
import { ShareTabContent } from './share-tab-content/share-tab-content';
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
  workspaceSlug,
  onCopyLink,
  onCopyPublishedLink,
  onPublish,
  onRestore,
  onUnpublish,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const publicUrl = buildPublishedDocumentUrl(publishedPath);

  useEffect(() => {
    const handleOpenShare = () => {
      setIsOpen((open) => !open);
    };

    window.addEventListener(OPEN_SHARE_EVENT, handleOpenShare);

    return () => {
      window.removeEventListener(OPEN_SHARE_EVENT, handleOpenShare);
    };
  }, []);

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'gap-1.5 px-2 text-[14px] h-7 text-muted-foreground rounded-sm',
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
        <Tabs defaultValue="share" className="gap-0">
          <TabsList
            variant="line"
            className="h-auto w-full rounded-none border-b justify-start px-3"
          >
            <TabsTrigger value="share" className="flex-none px-3 py-1">
              Share
            </TabsTrigger>
            <TabsTrigger value="publish" className="flex-none px-3 py-1">
              Publish
            </TabsTrigger>
          </TabsList>
          <TabsContent value="share" className="p-4 outline-none">
            <ShareTabContent
              canManageAccess={canManageAccess}
              document={document}
              isArchived={isArchived}
              workspaceSlug={workspaceSlug}
              onCopyLink={onCopyLink}
            />
          </TabsContent>
          <TabsContent value="publish" className="p-4 outline-none">
            <PublishTabContent
              isArchived={isArchived}
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
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
