import { WorkspaceShell } from '../_components/workspace-shell';

export default async function WorkspaceRoutesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };

  return (
    <WorkspaceShell workspaceSlug={workspaceSlug}>{children}</WorkspaceShell>
  );
}
