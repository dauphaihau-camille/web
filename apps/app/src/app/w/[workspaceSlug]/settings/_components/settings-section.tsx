import { cn } from '@shared/lib/utils';

function SettingsSection({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  children,
  className,
  description,
  showDivider = true,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  showDivider?: boolean;
  title: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative grid gap-10 p-4.5 md:grid-cols-[fit-content(66%)_minmax(0,1fr)] md:items-center',
        className,
      )}
    >
      <div className="">
        <div className="text-sm font-medium">{title}</div>
        {description
          ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          )
          : null}
      </div>

      <div className="flex w-full min-w-0 md:justify-end">{children}</div>

      {showDivider
        ? (
          <div className="absolute inset-x-5 bottom-0 border-b" />
        )
        : null}
    </div>
  );
}

export { SettingsSection, SettingsRow };
