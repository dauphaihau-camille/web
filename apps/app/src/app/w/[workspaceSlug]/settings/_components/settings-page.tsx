function SettingsPage({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description
          ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          )
          : null}
      </div>
      {children}
    </section>
  );
}

export { SettingsPage };
