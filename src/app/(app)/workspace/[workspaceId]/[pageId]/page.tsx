export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceId, pageId } = (await params) as { workspaceId: string; pageId: string };

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Workspace Page</h2>
      <p className="text-sm text-muted-foreground">
        Workspace <span className="font-mono">{workspaceId}</span>, document placeholder{' '}
        <span className="font-mono">{pageId}</span>.
      </p>
    </section>
  );
}
