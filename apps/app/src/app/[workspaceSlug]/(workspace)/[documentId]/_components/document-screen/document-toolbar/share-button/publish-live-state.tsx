import { Globe2Icon, LinkIcon } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from '@shared/components/ui/input-group';
import { Separator } from '@shared/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';

import type { PublishTabContentProps } from './types';

type PublishLiveStateProps = Pick<
  PublishTabContentProps,
  'canEdit' | 'publicUrl' | 'isUnpublishing' | 'onCopyPublishedLink' | 'onUnpublish'
> & {
  copyPublishedLinkShortcut: string;
};

export function PublishLiveState({
  canEdit,
  publicUrl,
  isUnpublishing,
  onCopyPublishedLink,
  onUnpublish,
  copyPublishedLinkShortcut,
}: PublishLiveStateProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-500/70" />
            <span className="relative inline-flex size-2 rounded-full bg-sky-600" />
          </span>
          <span>Live on the web</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Anyone with the link can view this published page.
        </p>
      </div>
      <InputGroup>
        <InputGroupInput value={publicUrl} disabled />
        <Tooltip>
          <TooltipTrigger
            render={
              <InputGroupButton
                size="icon-sm"
                onClick={() => {
                  void onCopyPublishedLink();
                }}
              >
                <LinkIcon className="size-4" />
                <span className="sr-only">Copy link</span>
              </InputGroupButton>
            }
          />
          <TooltipContent>
            <div className="flex flex-col gap-1">
              <span>Copy published link</span>
              <Kbd>{copyPublishedLinkShortcut}</Kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      </InputGroup>
      <Separator />
      <div className="flex items-center gap-2">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          disabled={!canEdit || isUnpublishing}
          onClick={onUnpublish}
        >
          {isUnpublishing ? 'Unpublishing...' : 'Unpublish'}
        </Button>
        <Button
          size="lg"
          variant="publish"
          className="flex-1"
          disabled={!publicUrl}
          onClick={() => {
            if (!publicUrl) {
              return;
            }

            window.open(publicUrl, '_blank', 'noopener,noreferrer');
          }}
        >
          <Globe2Icon className="size-4" />
          <span>View site</span>
        </Button>
      </div>
    </div>
  );
}
