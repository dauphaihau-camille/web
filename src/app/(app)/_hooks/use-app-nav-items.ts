'use client';

import { usePathname } from 'next/navigation';

const APP_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workspace/demo-workspace', label: 'Workspace' },
];

export function useAppNavItems() {
  const pathname = usePathname();

  return APP_NAV_ITEMS.map((item) => ({
    ...item,
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));
}
