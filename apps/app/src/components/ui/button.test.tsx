import { screen } from '@testing-library/react';

import { Button } from '@shared/components/ui/button';
import { renderWithProviders } from '@shared/test/render';

describe('Button', () => {
  it('renders children and applies variant classes', () => {
    renderWithProviders(<Button variant="publish">Publish</Button>);

    const button = screen.getByRole('button', { name: 'Publish' });

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-sky-600');
  });
});
