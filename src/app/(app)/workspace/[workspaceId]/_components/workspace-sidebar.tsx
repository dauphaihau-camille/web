import { PageTree } from './page-tree';

export function WorkspaceSidebar({ workspaceId }: { workspaceId: string }) {
  return (
    <aside className="rounded-xl border bg-background p-4 shadow-sm">
      <h3 className="font-semibold">Workspace</h3>
      <p className="mt-1 text-sm text-muted-foreground">{workspaceId}</p>
      <PageTree workspaceId={workspaceId} />
    </aside>
  );
}
