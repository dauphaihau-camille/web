import { WorkspaceProvider } from './_components/workspace-provider';
import { WorkspaceShell } from './_components/workspace-shell';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<unknown>;
}) {
  const { workspaceId } = (await params) as { workspaceId: string };

  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      <WorkspaceShell workspaceId={workspaceId}>{children}</WorkspaceShell>
    </WorkspaceProvider>
  );
}
