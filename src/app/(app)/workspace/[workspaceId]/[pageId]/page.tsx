export default async function WorkspaceDetailPage({
  params,
}: PageProps<'/workspace/[workspaceId]/[pageId]'>) {
  const { workspaceId, pageId } = await params;

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Workspace Page</h2>
      <p className="text-sm text-muted-foreground">
        Workspace <span className="font-mono">{workspaceId}</span>, page{' '}
        <span className="font-mono">{pageId}</span>.
      </p>
    </section>
  );
}
