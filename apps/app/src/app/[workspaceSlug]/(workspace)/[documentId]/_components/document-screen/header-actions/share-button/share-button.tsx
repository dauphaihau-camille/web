import { useKeyPress } from 'ahooks';
import { useEffect, useState } from 'react';

import { OPEN_SHARE_EVENT } from '@/app/[workspaceSlug]/_components/workspace-shortcuts-provider';
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

import { PublishTabContent } from './publish-tab-content';
import type { ShareButtonProps } from './types';

const SHARE_SHORTCUT = '\u21e7\u2318S';
const COPY_PUBLISHED_LINK_SHORTCUT = '\u21e7\u2318C';

export function ShareButton({
  isArchived,
  isPublished,
  isPublishing,
  isRestoring,
  isUnpublishing,
  publishedPath,
  onCopyPublishedLink,
  onPublish,
  onRestore,
  onUnpublish,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const publicUrl =
    typeof window !== 'undefined' && publishedPath
      ? `${window.location.origin}${publishedPath}`
      : '';

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
                buttonVariants({ variant: 'ghost', size: 'default' }),
                'px-2 text-sm text-muted-foreground',
              )}
            >
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
        <Tabs defaultValue="publish" className="gap-0">
          <TabsList
            variant="line"
            className="h-auto w-full rounded-none border-b justify-start px-3"
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex">
                    <TabsTrigger
                      value="share"
                      className="flex-none px-3 py-1"
                      disabled
                    >
                      Share
                    </TabsTrigger>
                  </span>
                }
              />
              <TooltipContent>Feature not available</TooltipContent>
            </Tooltip>
            <TabsTrigger value="publish" className="flex-none px-3 py-1">
              Publish
            </TabsTrigger>
          </TabsList>
          <TabsContent value="publish" className="p-4 outline-none">
            <PublishTabContent
              isArchived={isArchived}
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
