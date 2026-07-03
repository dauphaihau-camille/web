import { WorkspaceProvider } from './_components/workspace-provider';
import { WorkspaceShortcutsProvider } from './_components/workspace-shortcuts-provider';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };

  return (
    <WorkspaceProvider workspaceSlug={workspaceSlug}>
      <WorkspaceShortcutsProvider>
        {children}
      </WorkspaceShortcutsProvider>
    </WorkspaceProvider>
  );
}
