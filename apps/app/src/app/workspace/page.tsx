import { redirect } from 'next/navigation';

import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { listMyWorkspacesServer } from '@/domains/workspace/api/workspace.server.requests';
import { CreateWorkspaceFlow, workspaceRoutes } from '@/domains/workspace';

export default async function WorkspaceEntryPage() {
  await requireCurrentUserServer(workspaceRoutes.entry());

  const workspaces = await listMyWorkspacesServer();
  const firstWorkspace = workspaces[0];

  if (firstWorkspace) {
    redirect(workspaceRoutes.detail(firstWorkspace.slug));
  }

  return (
    <section className="w-full px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Create your first workspace</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Your account is active, but there is no workspace to open yet. Create one here to make
            the workspace slug route your default destination after login.
          </p>
        </div>
        <CreateWorkspaceFlow />
      </div>
    </section>
  );
}
