import { Globe2Icon } from 'lucide-react';

import { Button } from '@shared/components/ui/button';

import type { ShareButtonProps } from './types';

type PublishArchivedStateProps = Pick<
  ShareButtonProps,
  'canEdit' | 'isRestoring' | 'onRestore'
>;

export function PublishArchivedState({
  canEdit,
  isRestoring,
  onRestore,
}: PublishArchivedStateProps) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center space-y-4 text-center">
      <div className="space-y-3">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Globe2Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">
            Pages in Trash can&apos;t be published
          </p>
          <p className="text-sm text-muted-foreground">
            Restore this page to publish it to the web
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        className="px-8"
        disabled={!canEdit || isRestoring}
        onClick={onRestore}
      >
        {isRestoring ? 'Restoring...' : 'Restore'}
      </Button>
    </div>
  );
}
