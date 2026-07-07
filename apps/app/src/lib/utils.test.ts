import { cn } from '@shared/lib/utils';

describe('cn', () => {
  it('merges conditional and tailwind classes', () => {
    expect(cn('px-2', 'px-4', false && 'hidden', 'font-medium')).toBe(
      'px-4 font-medium',
    );
  });
});
