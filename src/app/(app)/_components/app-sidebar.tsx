'use client';

import Link from 'next/link';

import { useAppNavItems } from '../_hooks/use-app-nav-items';

export function AppSidebar() {
  const items = useAppNavItems();

  return (
    <aside className="rounded-xl border bg-background p-4 shadow-sm">
      <p className="text-sm font-semibold">App Navigation</p>
      <nav className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              item.active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
