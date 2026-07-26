'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2Icon,
  ChevronDownIcon,
  CheckIcon,
  LockIcon,
} from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@shared/lib/utils';

import { documentKeys } from '@/domains/document';
import { createTeamspace, type CreateTeamspaceInput } from '@/domains/teamspace';

type TeamspaceAccessMode = NonNullable<CreateTeamspaceInput['access_mode']>;

type CreateTeamspaceDialogProps = {
  open: boolean;
  workspaceSlug: string;
  onOpenChange: (open: boolean) => void;
};

const securityOptions: Array<{
  icon: typeof Building2Icon | typeof LockIcon;
  value: TeamspaceAccessMode;
  title: string;
  description: string;
}> = [
  {
    icon: Building2Icon,
    value: 'open',
    title: 'Open',
    description: 'Anyone can see and join',
  },
  {
    icon: LockIcon,
    value: 'restricted',
    title: 'Closed',
    description: 'Members only',
  },
];

function getSecurityDetails(accessMode: TeamspaceAccessMode) {
  return securityOptions.find((option) => option.value === accessMode) ??
    securityOptions[0];
}

export function CreateTeamspaceDialog({
  open,
  workspaceSlug,
  onOpenChange,
}: CreateTeamspaceDialogProps) {
  const queryClient = useQueryClient();
  const securityMenuRef = useRef<HTMLDivElement | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accessMode, setAccessMode] = useState<TeamspaceAccessMode>('open');
  const [isSecurityMenuOpen, setIsSecurityMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function resetForm() {
    setName('');
    setDescription('');
    setAccessMode('open');
    setIsSecurityMenuOpen(false);
    setErrorMessage('');
  }

  const createTeamspaceMutation = useMutation({
    mutationFn: (input: CreateTeamspaceInput) =>
      createTeamspace(workspaceSlug, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });

      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not create teamspace.',
      );
    },
  });

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!securityMenuRef.current?.contains(event.target as Node)) {
        setIsSecurityMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSecurityMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const securityDetails = getSecurityDetails(accessMode);
  const SecurityIcon = securityDetails.icon;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setErrorMessage('Teamspace name must be at least 2 characters.');
      return;
    }

    setErrorMessage('');

    createTeamspaceMutation.mutate({
      name: trimmedName,
      description: description.trim() || undefined,
      access_mode: accessMode,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a teamspace</DialogTitle>
          <DialogDescription>
            Teamspaces organize pages and permissions for a shared group.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="teamspace-name">Name</Label>
            <Input
              id="teamspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Engineering"
              disabled={createTeamspaceMutation.isPending}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamspace-description">Description</Label>
            <Textarea
              id="teamspace-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this teamspace for?"
              disabled={createTeamspaceMutation.isPending}
              className="min-h-24 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Security</Label>
            <div ref={securityMenuRef} className="relative">
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full justify-between gap-3 px-3 py-2 text-left"
                disabled={createTeamspaceMutation.isPending}
                aria-expanded={isSecurityMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsSecurityMenuOpen((current) => !current)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <SecurityIcon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 text-left">
                    <span className="block text-sm font-medium text-foreground">
                      {securityDetails.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {securityDetails.description}
                    </span>
                  </span>
                </span>
                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
              </Button>

              {isSecurityMenuOpen
                ? (
                  <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
                    {securityOptions.map((option) => {
                      const OptionIcon = option.icon;
                      const isSelected = option.value === accessMode;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
                            isSelected ? 'text-accent-foreground' : '',
                          )}
                          onClick={() => {
                            setAccessMode(option.value);
                            setIsSecurityMenuOpen(false);
                          }}
                        >
                          <OptionIcon className="size-4 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">
                              {option.title}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </span>
                          {isSelected ? <CheckIcon className="size-4 shrink-0" aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                  </div>
                )
                : null}
            </div>
          </div>

          {errorMessage
            ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )
            : null}

          <DialogFooter className="flex-row items-center justify-end sm:justify-end">
            <Button
              type="submit"
              disabled={createTeamspaceMutation.isPending || name.trim().length < 2}
            >
              {createTeamspaceMutation.isPending
                ? 'Creating...'
                : 'Create teamspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
