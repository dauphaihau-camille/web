import { UserMenu } from './user-menu';

export function AppTopbar() {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-medium">Example app shell</p>
        <p className="text-sm text-muted-foreground">
          Route-local UI stays inside the app tree.
        </p>
      </div>
      <UserMenu />
    </div>
  );
}
