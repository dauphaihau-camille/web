import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

const EXAMPLE_PAGES = [
  { id: 'overview', label: 'Overview' },
  { id: 'notes', label: 'Notes' },
];

export function PageTree({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-0 py-0">
          {EXAMPLE_PAGES.map((page) => (
            <SidebarMenuSubItem key={page.id}>
              <SidebarMenuSubButton
                render={(
                  <Link href={`/${workspaceId}/${page.id}`} />
                )}
                isActive={pathname === `/${workspaceId}/${page.id}`}
              >
                <span>{page.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
