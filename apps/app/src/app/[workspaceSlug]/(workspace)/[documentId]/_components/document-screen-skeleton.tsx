import { Skeleton } from '@shared/components/ui/skeleton';

export function DocumentScreenSkeleton() {
  return (
    <section className="space-y-6">
      <div className="sticky top-0 z-10 -mx-5 bg-background/95 px-5 pt-2 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-11 items-center justify-between gap-3">
          <Skeleton className="h-7 w-28 rounded px-1.5 py-1" />

          <div className="flex items-center gap-1.5">
            <Skeleton className="hidden h-5 w-28 rounded md:block" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl pt-20">
        <div className="space-y-3 px-[3.3rem]">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-12 w-3/4 rounded-lg md:h-14" />
          </div>
        </div>

        <div className="space-y-4 px-[3.3rem] pt-8">
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-10/12" />
          <Skeleton className="h-5 w-9/12" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-8/12" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-7/12" />
          <Skeleton className="h-5 w-10/12" />
        </div>
      </div>
    </section>
  );
}
