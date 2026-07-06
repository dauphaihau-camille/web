'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { buttonVariants } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { authRoutes } from '@/domains/auth';
import { cn } from '@/lib/utils';

const solutions = [
  {
    title: 'Enterprise',
    description: 'Advanced features for you org',
  },
  {
    title: 'Small business',
    description: 'Run your team on one tool',
  },
  {
    title: 'Personal',
    description: 'Free for individuals',
  },
] as const;

const features = [
  {
    title: 'Sync and organize',
    description: 'Keep your note handy',
  },
  {
    title: 'Tasks',
    description: 'Bring notes & to-dos app together',
  },
  {
    title: 'Drawings',
    description: 'Add own simple drawings and illustrations everywhere',
  },
  {
    title: 'Templates',
    description: 'Create better notes, faster',
  },
  {
    title: 'Offline Support',
    description: 'Use Camille whether you have an internet connection or not!',
  },
  {
    title: 'Versions',
    description: '(Coming soon) See and compare different text versions.',
  },
] as const;

export function Navigate() {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex h-16 items-center justify-between py-4">
      <Link href="/" className="text-xl font-bold hover:opacity-50">
        Camille
      </Link>

      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
            <NavigationMenuContent className="rounded-lg bg-white p-0 shadow-lg ring-1 ring-black/5">
              <ul className="grid w-[500px] grid-cols-[0.75fr_1fr] gap-2 p-5">
                <li className="row-span-3">
                  <NavigationMenuLink
                    href="/"
                    className="flex h-full flex-col justify-end rounded-md bg-linear-to-br from-zinc-400 to-zinc-700 p-6 text-white hover:bg-linear-to-br focus:bg-linear-to-br"
                  >
                    <svg aria-hidden width="38" height="38" viewBox="0 0 25 25" fill="white">
                      <path d="M12 25C7.58173 25 4 21.4183 4 17C4 12.5817 7.58173 9 12 9V25Z" />
                      <path d="M12 0H4V8H12V0Z" />
                      <path d="M17 8C19.2091 8 21 6.20914 21 4C21 1.79086 19.2091 0 17 0C14.7909 0 13 1.79086 13 4C13 6.20914 14.7909 8 17 8Z" />
                    </svg>
                    <div className="mt-4 mb-2 text-lg font-medium">Camille</div>
                    <p className="text-sm leading-5 text-zinc-100">
                      Unstyled, accessible components for React.
                    </p>
                  </NavigationMenuLink>
                </li>
                {solutions.map(item => (
                  <li key={item.title}>
                    <MarketingMenuLink title={item.title} href="#">
                      {item.description}
                    </MarketingMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Features</NavigationMenuTrigger>
            <NavigationMenuContent className="rounded-lg bg-white p-0 shadow-lg ring-1 ring-black/5">
              <ul className="grid w-[600px] grid-flow-col grid-rows-3 gap-2 p-5">
                {features.map(item => (
                  <li key={item.title}>
                    <MarketingMenuLink title={item.title} href="#">
                      {item.description}
                    </MarketingMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Link
              href="/pricing"
              className={cn(
                navigationMenuTriggerStyle(),
                pathname === '/pricing' && 'bg-muted/50 text-foreground',
              )}
            >
              Pricing
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-2">
        <Link
          href={authRoutes.login()}
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'px-2.5 text-[13px]')}
        >
          Login
        </Link>
        <Link href={authRoutes.signup()} className={cn(buttonVariants({ size: 'sm' }), 'px-2.5 text-[13px]')}>
          Signup
        </Link>
      </div>
    </div>
  );
}

function MarketingMenuLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <NavigationMenuLink href={href} className="block rounded-md p-3 hover:bg-[#f8f9f5] focus:bg-[#f8f9f5]">
      <div className="mb-1 text-[15px] leading-5 font-medium text-zinc-950">{title}</div>
      <p className="text-sm leading-5 text-[#73726e]">{children}</p>
    </NavigationMenuLink>
  );
}
