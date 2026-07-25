'use client';

import { InvitePanel } from './invite-panel/invite-panel';
import { ShareOverview } from './share-overview/share-overview';
import { useShareTabContext } from './share-tab-context';

export function ShareTabContent() {
  const shareTab = useShareTabContext();

  return shareTab.isInviteMode ? <InvitePanel /> : <ShareOverview />;
}
