import {
  act, render, screen, waitFor, 
} from '@testing-library/react';

import { WakeClient } from './wake-client';

const { replaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe('WakeClient integration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    replaceMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
  });

  it('stops automatic retries after 90 seconds and shows the timeout state', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    global.fetch = fetchMock as typeof fetch;

    render(<WakeClient nextPath="/documents" retryPath="/wake?next=%2Fdocuments" />);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Retry now')).toHaveAttribute('aria-disabled', 'true');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(90000);
    });

    expect(
      screen.getByText(
        'Automatic retries stopped after 90 seconds because the backend is still unavailable.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retry now' })).toHaveAttribute(
      'href',
      '/wake?next=%2Fdocuments',
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('redirects immediately once the backend becomes healthy', async () => {
    vi.useRealTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as typeof fetch;

    render(<WakeClient nextPath="/documents" retryPath="/wake?next=%2Fdocuments" />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/documents');
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
