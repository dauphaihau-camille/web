import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function DocumentNotFound() {
  return (
    <Empty className="min-h-[calc(100svh-2.75rem)]">
      <EmptyHeader>
        <EmptyTitle className="text-lg md:text-lg">
          Document not found
        </EmptyTitle>
        <EmptyDescription className="text-base md:text-base">
          This document does not exist or is no longer available.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
