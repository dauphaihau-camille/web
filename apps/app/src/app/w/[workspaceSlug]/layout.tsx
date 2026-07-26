import { notFound } from 'next/navigation';

import {
  isReservedWorkspaceDomain,
  workspaceDomainPattern,
} from '@/domains/workspace';

import { WorkspaceInitialLoadGate } from './_components/workspace-initial-load-gate';
import { WorkspaceProvider } from './_components/workspace-provider';
import { WorkspaceShortcutsProvider } from './_components/workspace-shortcuts-provider';

function isValidWorkspaceSlug(workspaceSlug: string) {
  return workspaceDomainPattern.test(workspaceSlug) && !isReservedWorkspaceDomain(workspaceSlug);
}

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };

  if (!isValidWorkspaceSlug(workspaceSlug)) {
    notFound();
  }

  return (
    <WorkspaceProvider workspaceSlug={workspaceSlug}>
      <WorkspaceShortcutsProvider>
        <WorkspaceInitialLoadGate>{children}</WorkspaceInitialLoadGate>
      </WorkspaceShortcutsProvider>
    </WorkspaceProvider>
  );
}
