'use client';

import { usePathname } from 'next/navigation';

import { useMyWorkspacesQuery } from '@/domains/workspace';

export function useAppNavItems() {
  const pathname = usePathname();
  const workspaceListQuery = useMyWorkspacesQuery();
  const firstWorkspace = workspaceListQuery.data?.[0];
  const workspaceHref = firstWorkspace ? `/workspace/${firstWorkspace.id}` : '/login';
  const items = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: workspaceHref, label: 'Workspace' },
  ];

  return items.map((item) => ({
    ...item,
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));
}
