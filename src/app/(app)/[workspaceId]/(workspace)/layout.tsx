import { WorkspaceShell } from '../_components/workspace-shell';

export default async function WorkspaceRoutesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<unknown>;
}) {
  const { workspaceId } = (await params) as { workspaceId: string };

  return (
    <WorkspaceShell workspaceId={workspaceId}>{children}</WorkspaceShell>
  );
}
