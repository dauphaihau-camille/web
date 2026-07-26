import { redirect } from 'next/navigation';

import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { workspaceRoutes } from '@/domains/workspace';
import { getDefaultWorkspaceServer } from '@/domains/workspace/api/workspace.server.requests';

import { CreateWorkspaceFlow } from '@/domains/workspace/components';

export default async function WorkspaceEntryPage() {
  await requireCurrentUserServer(workspaceRoutes.entry());

  const defaultWorkspace = await getDefaultWorkspaceServer();

  if (defaultWorkspace) {
    redirect(workspaceRoutes.detail(defaultWorkspace.slug));
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
