import { WorkspaceProvider } from './_components/workspace-provider';
import { WorkspaceShell } from './_components/workspace-shell';

export default async function WorkspaceLayout({
  children,
  params,
}: LayoutProps<'/workspace/[workspaceId]'>) {
  const { workspaceId } = await params;

  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      <WorkspaceShell workspaceId={workspaceId}>{children}</WorkspaceShell>
    </WorkspaceProvider>
  );
}
