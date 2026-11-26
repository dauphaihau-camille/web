import { Button } from '@shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@shared/components/ui/empty';
import { Separator } from '@shared/components/ui/separator';
import { Skeleton } from '@shared/components/ui/skeleton';

import { GallerySection } from '../section';

const SWATCHES = [
  'bg-background border-border',
  'bg-card border-border',
  'bg-popover border-border',
  'bg-muted border-border',
  'bg-accent border-border',
  'bg-primary border-primary',
  'bg-secondary border-secondary',
  'bg-destructive border-destructive',
  'bg-destructive-solid border-destructive-solid',
  'bg-destructive-surface border-destructive-solid',
];

export function SurfacesSection() {
  return (
    <GallerySection
      title="Surfaces and states"
      description="Token swatches, skeleton, empty state, separator."
    >
      <div className="grid grid-cols-5 gap-2">
        {SWATCHES.map(swatch => (
          <div
            key={swatch}
            className={`h-12 rounded-lg border ${swatch}`}
            title={swatch}
          />
        ))}
      </div>
      <Separator />
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span aria-hidden className="size-4 rounded-sm bg-current" />
            </EmptyMedia>
            <EmptyTitle>No documents yet</EmptyTitle>
            <EmptyDescription>
              Create your first page to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">New page</Button>
          </EmptyContent>
        </Empty>
      </div>
    </GallerySection>
  );
}
