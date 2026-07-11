import { Globe2Icon } from 'lucide-react';

import { Button } from '@shared/components/ui/button';

import type { ShareButtonProps } from './types';

type PublishDraftStateProps = Pick<ShareButtonProps, 'isPublishing' | 'onPublish'>;

export function PublishDraftState({
  isPublishing,
  onPublish,
}: PublishDraftStateProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="space-y-2">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Globe2Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Publish to web
          </p>
          <p className="text-sm text-muted-foreground">
            Publish a static website of this page.
          </p>
        </div>
      </div>
      <Button
        variant="publish"
        className="w-full"
        disabled={isPublishing}
        onClick={onPublish}
      >
        {isPublishing ? 'Publishing...' : 'Publish'}
      </Button>
    </div>
  );
}
