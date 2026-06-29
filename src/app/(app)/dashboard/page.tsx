import Link from 'next/link';

import { UserSessionCard } from './user-session-card';

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Foundation Dashboard</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Phase 0 keeps this shell as scaffolding. Auth, workspace discovery, and route data now
          come from the API so later Camille UI work can replace placeholder visuals without
          rebuilding the app structure.
        </p>
      </div>
      <UserSessionCard />
      <div className="rounded-2xl border bg-muted/20 p-5">
        <p className="text-sm font-medium">Reference product surface</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use Camille v1 as the UX reference while implementing features inside this v2 folder
          structure.
        </p>
        <Link href="/login" className="mt-4 inline-flex text-sm font-medium underline underline-offset-4">
          Open the auth flow
        </Link>
      </div>
    </section>
  );
}
