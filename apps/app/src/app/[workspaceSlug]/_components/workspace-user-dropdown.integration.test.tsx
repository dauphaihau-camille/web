import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
  beforeEach, describe, expect, it, vi, 
} from 'vitest';

import { renderWithProviders } from '@shared/test/render';

import { WorkspaceUserDropdown } from './workspace-user-dropdown';

const {
  clearDocumentCollaborationStorageForUserMock,
  logoutMock,
  pushMock,
  replaceMock,
} = vi.hoisted(() => ({
  clearDocumentCollaborationStorageForUserMock: vi.fn(),
  logoutMock: vi.fn(),
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/domains/auth', async () => {
  const actual = await vi.importActual('@/domains/auth');

  return {
    ...actual,
    logout: logoutMock,
    useCurrentUserQuery: () => ({
      data: {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'User One',
      },
    }),
  };
});

vi.mock('@/domains/document', async () => {
  const actual = await vi.importActual('@/domains/document');

  return {
    ...actual,
    clearDocumentCollaborationStorageForUser:
      clearDocumentCollaborationStorageForUserMock,
  };
});

vi.mock('@/domains/workspace', async () => {
  const actual = await vi.importActual('@/domains/workspace');

  return {
    ...actual,
    myWorkspaceListQueryOptions: () => ({
      queryKey: ['workspace', 'mine'],
      queryFn: async () => [],
    }),
  };
});

vi.mock('@/components/ui/dropdown-menu', () => {
  function PassThrough({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  function ButtonLike({
    children,
    disabled,
    onClick,
  }: {
    children: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }) {
    return (
      <button disabled={disabled} onClick={onClick} type="button">
        {children}
      </button>
    );
  }

  return {
    DropdownMenu: PassThrough,
    DropdownMenuCheckboxItem: ButtonLike,
    DropdownMenuContent: PassThrough,
    DropdownMenuGroup: PassThrough,
    DropdownMenuItem: ButtonLike,
    DropdownMenuLabel: PassThrough,
    DropdownMenuSeparator: () => null,
    DropdownMenuSub: PassThrough,
    DropdownMenuSubContent: PassThrough,
    DropdownMenuSubTrigger: ButtonLike,
    DropdownMenuTrigger: ButtonLike,
  };
});

vi.mock('./create-workspace-dialog', () => ({
  CreateWorkspaceDialog: () => null,
}));

vi.mock('./logout-confirm-dialog', () => ({
  LogoutConfirmDialog: ({
    onConfirm,
    open,
  }: {
    onConfirm: () => void;
    open: boolean;
  }) => open
    ? (
      <button onClick={onConfirm} type="button">
        Confirm logout
      </button>
    )
    : null,
}));

vi.mock('./workspace-skeleton/workspace-user-dropdown-skeleton', () => ({
  WorkspaceUserDropdownSkeleton: () => <div>Loading user dropdown</div>,
}));

describe('WorkspaceUserDropdown logout', () => {
  beforeEach(() => {
    logoutMock.mockResolvedValue(undefined);
    clearDocumentCollaborationStorageForUserMock.mockResolvedValue(undefined);
    pushMock.mockClear();
    replaceMock.mockClear();
    clearDocumentCollaborationStorageForUserMock.mockClear();
    logoutMock.mockClear();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        replace: replaceMock,
      },
    });
  });

  it('clears local document collaboration storage for the current user before redirecting', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <WorkspaceUserDropdown
        workspace={{
          current_user_role: 'owner',
          description: undefined,
          id: 'workspace-1',
          name: 'Acme',
          slug: 'acme',
          updated_at: '2026-01-01T00:00:00.000Z',
          created_at: '2026-01-01T00:00:00.000Z',
          version: 1,
        }}
        workspaceSlug="acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: /log out/i }));
    await user.click(screen.getByRole('button', { name: /confirm logout/i }));

    await waitFor(() => {
      expect(clearDocumentCollaborationStorageForUserMock).toHaveBeenCalledWith('user-1');
    });
    expect(logoutMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/login?loggedOut=1');
  });
});
