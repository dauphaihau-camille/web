import {
  // CircleHelpIcon,
  LinkIcon,
} from 'lucide-react';

import { Button } from '@shared/components/ui/button';

export function ShareFooter({
  onCopyLink,
}: {
  onCopyLink: () => void | Promise<void>;
}) {
  return (
    <div className="-mx-4 -mb-4 flex items-center justify-between border-t px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {/*<CircleHelpIcon className="size-4" />
        <span>Learn about sharing</span>*/}
      </div>
      <Button variant="outline" onClick={onCopyLink} className="rounded-sm">
        <LinkIcon className="size-4" />
        Copy link
      </Button>
    </div>
  );
}
