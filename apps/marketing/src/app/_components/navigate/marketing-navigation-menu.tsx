'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@shared/components/ui/navigation-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import { cn } from '@shared/lib/utils';

const solutions = [
  {
    title: 'Enterprise',
    description: 'Advanced features for your organization',
  },
  {
    title: 'Small business',
    description: 'Run your team in one workspace',
  },
  {
    title: 'Personal',
    description: 'Free for individuals and side projects',
  },
] as const;

const features = [
  {
    title: 'Sync and organize',
    description: 'Keep notes and docs structured across every device.',
  },
  {
    title: 'Tasks',
    description: 'Turn notes into actionable work without switching tools.',
  },
  {
    title: 'Drawings',
    description: 'Add lightweight visual thinking directly into documents.',
  },
  {
    title: 'Templates',
    description: 'Start faster with reusable formats and workflows.',
  },
  {
    title: 'Offline support',
    description: 'Keep working even when your connection is unreliable.',
  },
  {
    title: 'Versions',
    description: 'Track changes and compare revisions over time.',
  },
] as const;

export function MarketingNavigationMenu() {
  const pathname = usePathname();
  const isPricingDisabled = true;

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent className="rounded-lg bg-popover p-0 text-popover-foreground shadow-lg ring-1 ring-border/60">
            <ul className="grid w-[500px] grid-cols-[0.75fr_1fr] gap-2 p-5">
              <li className="row-span-3">
                <NavigationMenuLink
                  href="/"
                  className="flex h-full flex-col justify-end rounded-md bg-linear-to-br from-primary/75 to-primary p-6 text-primary-foreground hover:opacity-95 focus:opacity-95"
                >
                  <svg
                    aria-hidden
                    width="38"
                    height="38"
                    viewBox="0 0 25 25"
                    fill="white"
                  >
                    <path d="M12 25C7.58173 25 4 21.4183 4 17C4 12.5817 7.58173 9 12 9V25Z" />
                    <path d="M12 0H4V8H12V0Z" />
                    <path d="M17 8C19.2091 8 21 6.20914 21 4C21 1.79086 19.2091 0 17 0C14.7909 0 13 1.79086 13 4C13 6.20914 14.7909 8 17 8Z" />
                  </svg>
                  <div className="mt-4 mb-2 text-lg font-medium">Camille</div>
                  <p className="text-sm leading-5 text-primary-foreground/95">
                    Docs, notes, and collaboration in one focused workspace.
                  </p>
                </NavigationMenuLink>
              </li>
              {solutions.map((item) => (
                <li key={item.title}>
                  <MarketingMenuLink title={item.title} disabled>
                    {item.description}
                  </MarketingMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Features</NavigationMenuTrigger>
          <NavigationMenuContent className="rounded-lg bg-popover p-0 text-popover-foreground shadow-lg ring-1 ring-border/60">
            <ul className="grid w-[600px] grid-flow-col grid-rows-3 gap-2 p-5">
              {features.map((item) => (
                <li key={item.title}>
                  <MarketingMenuLink title={item.title} disabled>
                    {item.description}
                  </MarketingMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          {isPricingDisabled
            ? (
              <TooltipProvider delay={150}>
                <Tooltip>
                  <TooltipTrigger
                    aria-disabled="true"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      'cursor-not-allowed text-foreground transition-colors',
                    )}
                  >
                    Pricing
                  </TooltipTrigger>
                  <TooltipContent>Pricing is not available yet. Coming soon.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
            : (
              <Link
                href="/pricing"
                className={cn(
                  navigationMenuTriggerStyle(),
                  pathname === '/pricing' && 'bg-muted/50 text-foreground',
                )}
              >
                Pricing
              </Link>
            )}
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MarketingMenuLink({
  href,
  title,
  children,
  disabled = false,
}: {
  href?: string;
  title: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <TooltipProvider delay={150}>
        <Tooltip>
          <TooltipTrigger
            aria-disabled="true"
            className="block w-full cursor-not-allowed rounded-md p-3 text-left opacity-85 transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
          >
            <div className="mb-1 text-[15px] leading-5 font-medium text-foreground">
              {title}
            </div>
            <p className="text-sm leading-5 text-foreground/75">{children}</p>
          </TooltipTrigger>
          <TooltipContent>This section is not available yet. Coming soon.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <NavigationMenuLink
      href={href ?? '/'}
      className="block rounded-md p-3 hover:bg-muted focus:bg-muted"
    >
      <div className="mb-1 text-[15px] leading-5 font-medium text-foreground">
        {title}
      </div>
      <p className="text-sm leading-5 text-foreground/75">{children}</p>
    </NavigationMenuLink>
  );
}
