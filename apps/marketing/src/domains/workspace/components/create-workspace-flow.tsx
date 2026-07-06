'use client';

import { useState } from 'react';

import { CreateWorkspaceForm } from './create-workspace-form';
import { CreateWorkspaceRedirectDialog } from './create-workspace-redirect-dialog';

type CreateWorkspaceFlowProps = {
  hideFormWhileRedirecting?: boolean;
  variant?: 'card' | 'plain';
};

export function CreateWorkspaceFlow({
  hideFormWhileRedirecting = false,
  variant = 'card',
}: CreateWorkspaceFlowProps = {}) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  return (
    <>
      <CreateWorkspaceRedirectDialog open={isRedirecting} />
      <CreateWorkspaceForm
        hideFormWhileRedirecting={hideFormWhileRedirecting}
        onRedirectingChange={setIsRedirecting}
        variant={variant}
      />
    </>
  );
}
