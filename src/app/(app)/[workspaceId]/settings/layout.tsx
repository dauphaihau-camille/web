import { SettingsShell } from './_components/settings-shell';

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<unknown>;
}) {
  const { workspaceId } = (await params) as { workspaceId: string };

  return (
    <SettingsShell workspaceId={workspaceId}>{children}</SettingsShell>
  );
}
