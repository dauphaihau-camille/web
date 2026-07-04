import { screen } from '@testing-library/react';

import { Button } from './button';
import { renderWithProviders } from '@/test/render';

describe('Button', () => {
  it('renders children and applies variant classes', () => {
    renderWithProviders(<Button variant="publish">Publish</Button>);

    const button = screen.getByRole('button', { name: 'Publish' });

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-sky-600');
  });
});
