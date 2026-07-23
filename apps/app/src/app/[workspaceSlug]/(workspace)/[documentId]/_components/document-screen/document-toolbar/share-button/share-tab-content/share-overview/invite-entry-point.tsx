import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';

export function InviteEntryPoint({
  disabled,
  onOpenInvite,
}: {
  disabled: boolean;
  onOpenInvite: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'flex h-8 flex-1 items-center rounded-sm border px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-text',
        )}
        onClick={onOpenInvite}
      >
        Email or group, separated by commas
      </button>
      <Button
        disabled={disabled}
        onClick={onOpenInvite}
        className="rounded-sm"
      >
        Invite
      </Button>
    </div>
  );
}
