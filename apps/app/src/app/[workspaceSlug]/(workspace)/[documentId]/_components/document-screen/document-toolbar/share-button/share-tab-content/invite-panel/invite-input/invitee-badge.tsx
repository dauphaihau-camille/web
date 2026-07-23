import { XIcon } from 'lucide-react';

import { InputGroupButton } from '@shared/components/ui/input-group';

export function InviteeBadge({
  email,
  onRemove,
}: {
  email: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-sm font-medium text-amber-950 dark:bg-amber-400/20 dark:text-amber-100">
      <span className="truncate">{email}</span>
      <InputGroupButton
        size="icon-xs"
        variant="ghost"
        aria-label={`Remove ${email}`}
        className="size-5 text-amber-950/70 hover:bg-amber-200/70 dark:text-amber-100/80 dark:hover:bg-amber-300/20"
        onClick={onRemove}
      >
        <XIcon className="size-3.5" />
      </InputGroupButton>
    </span>
  );
}
