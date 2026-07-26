import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { RelativeTimeText } from './relative-time-text';

describe('RelativeTimeText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-26T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ages just now text into a minute-based label while mounted', async () => {
    render(
      <RelativeTimeText
        fallback="recently"
        prefix="Edited"
        value="2026-07-26T00:00:00.000Z"
      />,
    );

    expect(screen.getByText('Edited just now')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(screen.getByText('Edited 1 minute ago')).toBeInTheDocument();
  });
});
