import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@shared/components/ui/empty";

export default function SharedDocumentNotFound() {
  return (
    <Empty className="min-h-svh gap-0 bg-background px-6">
      <EmptyHeader className="max-w-3xl gap-4">
        <EmptyTitle className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
          This document couldn&apos;t be found
        </EmptyTitle>
        <EmptyDescription className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-lg">
          You may not have access, or it might have been deleted or moved. Check
          the link and try again.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
