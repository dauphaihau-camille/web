import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';

import { GallerySection } from '../section';

const BUTTON_VARIANTS = [
  'default',
  'publish',
  'destructive-solid',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'link',
] as const;

const BUTTON_SIZES = ['xs', 'default', 'lg'] as const;

const ICON_SIZES = ['icon-xs', 'icon-sm', 'icon', 'icon-lg', 'icon-xl'] as const;

const BADGE_VARIANTS = [
  'default',
  'secondary',
  'destructive',
  'outline',
  'ghost',
  'link',
] as const;

export function ButtonsSection() {
  return (
    <GallerySection title="Buttons" description="Every variant at the core sizes.">
      <div className="space-y-3">
        {BUTTON_VARIANTS.map(variant => (
          <div key={variant} className="flex flex-wrap items-center gap-2">
            <span className="w-36 shrink-0 font-mono text-xs text-muted-foreground">
              {variant}
            </span>
            {BUTTON_SIZES.map(size => (
              <Button key={size} variant={variant} size={size}>
                {size === 'default' ? variant : size}
              </Button>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-36 shrink-0 font-mono text-xs text-muted-foreground">
            icon
          </span>
          {ICON_SIZES.map(size => (
            <Button key={size} variant="outline" size={size} aria-label={size}>
              <span aria-hidden className="size-2 rounded-sm bg-current" />
            </Button>
          ))}
          <Button disabled>disabled</Button>
        </div>
      </div>
    </GallerySection>
  );
}

export function BadgesSection() {
  return (
    <GallerySection title="Badges" description="Six variants, one row.">
      <div className="flex flex-wrap items-center gap-2">
        {BADGE_VARIANTS.map(variant => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>
    </GallerySection>
  );
}
