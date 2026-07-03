import { BlockNoteEditor } from '@/components/editor/blocknote-editor';
import { getPublicDocumentServer } from '@/domains/publish/api/publish.server.requests';

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { publishedDocumentId } = (await params) as { publishedDocumentId: string };
  const document = await getPublicDocumentServer(publishedDocumentId);

  return (
    <main className="min-h-svh px-5 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="space-y-3 px-[3.8rem]">
          <h1 className="text-4xl font-semibold tracking-tight">{document.title}</h1>
        </div>
        <div className="pt-6">
          <BlockNoteEditor
            documentTitle={document.title}
            content={document.content}
            workspaceSlug=""
            editable={false}
          />
        </div>
      </div>
    </main>
  );
}
