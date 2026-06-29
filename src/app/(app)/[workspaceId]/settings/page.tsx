import { WorkspaceSettingsPanel } from '../_components/workspace-settings-panel';

export default function WorkspaceSettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Workspace settings</h2>
        <p className="text-sm text-muted-foreground">
          Update the workspace name, slug, and description for this space.
        </p>
      </div>
      <WorkspaceSettingsPanel />
    </section>
  );
}
