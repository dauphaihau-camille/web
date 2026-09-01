import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { renderWithProviders } from '@shared/test/render';
import { mswServer } from '@shared/test/msw/server';

import { ForgotPasswordForm } from './forgot-password-form';

const authForgotPasswordUrlPattern = /\/auth\/forgot-password\/?$/;

const { useSearchParamsGetMock } = vi.hoisted(() => ({
  useSearchParamsGetMock: vi.fn<(key: string) => string | null>(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: useSearchParamsGetMock,
  }),
}));

describe('ForgotPasswordForm integration', () => {
  let searchParams: URLSearchParams;

  beforeEach(() => {
    searchParams = new URLSearchParams();
    useSearchParamsGetMock.mockImplementation((key) => searchParams.get(key));
  });

  it('accepts a Password Reset Request without disclosing account existence', async () => {
    const user = userEvent.setup();
    const requestBodies: unknown[] = [];

    searchParams = new URLSearchParams('redirectTo=/w/acme');

    mswServer.use(
      http.post(authForgotPasswordUrlPattern, async ({ request }) => {
        requestBodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'If member@example.com matches an email address we have on file, we\'ve sent you an email' +
      ' with a link to reset your password.',
    );
    expect(screen.getByRole('status')).not.toHaveTextContent('backup email address');
    expect(screen.getByRole('button', { name: 'Back to login' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(requestBodies).toEqual([
      {
        email: 'member@example.com',
        redirect_to: '/w/acme',
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'resend' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Check again. If you still haven\'t received the email, this may be the wrong email' +
      ' address for your account. Reconfirm your email address.',
    );
    expect(screen.queryByRole('button', { name: 'resend' })).not.toBeInTheDocument();
    expect(requestBodies).toEqual([
      {
        email: 'member@example.com',
        redirect_to: '/w/acme',
      },
      {
        email: 'member@example.com',
        redirect_to: '/w/acme',
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'Reconfirm your email address.' }));

    expect(screen.getByLabelText('Email')).toHaveValue('member@example.com');
  });
});
