import { ChevronLeftIcon } from 'lucide-react';
import { useState } from 'react';

import type { Document } from '@/domains/document';
import { Button } from '@shared/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { PublishTabContent } from './publish-tab-content';
import { ShareTabContent } from './share-tab-content/share-tab-content';
import { ShareTabProvider } from './share-tab-content/share-tab-context';
import { useShareTab } from './_hooks/use-share-tab';
import type { PublishTabContentProps } from './types';

type SharePopoverContentProps = PublishTabContentProps & {
  canManageAccess: boolean;
  copyPublishedLinkShortcut: string;
  document: Document;
  onCopyLink: () => void | Promise<void>;
  workspaceSlug: string;
};

export function SharePopoverContent({
  canManageAccess,
  copyPublishedLinkShortcut,
  document,
  isArchived,
  workspaceSlug,
  onCopyLink,
  ...publishProps
}: SharePopoverContentProps) {
  const [tabValue, setTabValue] = useState('share');
  const shareTab = useShareTab({
    canManageAccess,
    document,
    isArchived,
    workspaceSlug,
  });

  return (
    <ShareTabProvider
      value={{
        ...shareTab,
        copyLink: onCopyLink,
      }}
    >
      <Tabs
        value={shareTab.isInviteMode ? 'share' : tabValue}
        onValueChange={setTabValue}
        className="gap-0"
      >
        <div className="border-b">
          {shareTab.isInviteMode
            ? (
              <div className="flex h-9 items-center gap-1 px-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Back to sharing"
                  onClick={shareTab.invitePanel.actions.back}
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <p className="text-sm font-medium">Invite</p>
              </div>
            )
            : (
              <TabsList
                variant="line"
                className="h-auto w-full justify-start rounded-none border-b-0 px-3"
              >
                <TabsTrigger value="share" className="flex-none px-3 py-1">
                  Share
                </TabsTrigger>
                <TabsTrigger value="publish" className="flex-none px-3 py-1">
                  Publish
                </TabsTrigger>
              </TabsList>
            )}
        </div>

        <TabsContent value="share" className="p-4 outline-none">
          <ShareTabContent />
        </TabsContent>

        <TabsContent value="publish" className="p-4 outline-none">
          <PublishTabContent
            {...publishProps}
            isArchived={isArchived}
            copyPublishedLinkShortcut={copyPublishedLinkShortcut}
          />
        </TabsContent>
      </Tabs>
    </ShareTabProvider>
  );
}
