import { WorkspaceProvider } from './_components/workspace-provider';

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
      {children}
    </WorkspaceProvider>
  );
}
