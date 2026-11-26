import { BadgesSection, ButtonsSection } from './sections/buttons-section';
import { InputsSection } from './sections/inputs-section';
import { OverlaysSection } from './sections/overlays-section';
import { SurfacesSection } from './sections/surfaces-section';
import { ThemeSwitcher } from './theme-switcher';

export function DesignGallery() {
  return (
    <main
      data-gallery
      className="mx-auto w-full max-w-5xl bg-background px-6 py-10 text-foreground"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Design system gallery
          </h1>
          <p className="text-sm text-muted-foreground">
            Dev-only surface for the primitives in
            {' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 text-xs">
              packages/shared/src/components/ui
            </code>
            . Screenshotted by
            {' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 text-xs">
              tests/visual/design-gallery.spec.ts
            </code>
            .
          </p>
        </div>
        <ThemeSwitcher />
      </header>

      <ButtonsSection />
      <BadgesSection />
      <InputsSection />
      <OverlaysSection />
      <SurfacesSection />
    </main>
  );
}
