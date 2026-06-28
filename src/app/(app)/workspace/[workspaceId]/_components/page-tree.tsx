import Link from 'next/link';

const EXAMPLE_PAGES = [
  { id: 'overview', label: 'Overview' },
  { id: 'notes', label: 'Notes' },
];

export function PageTree({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Pages
      </p>
      <div className="flex flex-col gap-2">
        {EXAMPLE_PAGES.map((page) => (
          <Link
            key={page.id}
            href={`/workspace/${workspaceId}/${page.id}`}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {page.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
