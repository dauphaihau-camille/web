import { SettingsShell } from './_components/settings-shell';

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };

  return (
    <SettingsShell workspaceSlug={workspaceSlug}>{children}</SettingsShell>
  );
}
