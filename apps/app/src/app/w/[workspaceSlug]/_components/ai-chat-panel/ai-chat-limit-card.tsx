'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';

export function AiChatLimitCard() {
  const [isDocked, setIsDocked] = useState(false);
  const upgradeButton = (
    <Button
      type="button"
      size="sm"
      disabled
      aria-disabled="true"
    >
      Upgrade Camille AI
    </Button>
  );

  return (
    <div
      className="relative z-0 mx-3 mb-36 overflow-visible transition-[height] duration-200 ease-out data-[docked=false]:h-36 data-[docked=true]:h-8"
      data-docked={isDocked}
    >
      <section
        aria-label="Workspace AI limit"
        className="absolute inset-x-0 top-0 rounded-xl border border-border bg-muted/40 shadow-sm transition-transform duration-200 ease-out"
      >
        <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-1">
          <p className="min-w-0 truncate text-sm font-medium">Workspace AI limit reached</p>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-expanded={!isDocked}
            aria-label={isDocked ? 'Show AI limit details' : 'Dock AI limit notice'}
            className="shrink-0 rounded-full"
            onClick={() => setIsDocked((current) => !current)}
          >
            {isDocked
              ? <ChevronUpIcon className="size-4" />
              : <ChevronDownIcon className="size-4" />}
          </Button>
        </div>

        <div
          aria-hidden={isDocked}
          className="space-y-3 px-3 pb-3 data-[docked=true]:pointer-events-none"
          data-docked={isDocked}
        >
          <p className="text-xs leading-5 text-muted-foreground">
            This workspace has used its included Camille AI responses. Upgrade to continue using AI assistance.
          </p>

          <div className="flex justify-end">
            <Tooltip>
              <TooltipTrigger render={<span className="shrink-0">{upgradeButton}</span>} />
              <TooltipContent>Camille AI upgrades are coming soon.</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </section>
    </div>
  );
}
