export default async function WorkspacePage({
  params,
}: PageProps<'/workspace/[workspaceId]'>) {
  const { workspaceId } = await params;

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Workspace Home</h2>
      <p className="text-sm text-muted-foreground">
        Minimal example for <span className="font-mono">{workspaceId}</span>.
      </p>
    </section>
  );
}
