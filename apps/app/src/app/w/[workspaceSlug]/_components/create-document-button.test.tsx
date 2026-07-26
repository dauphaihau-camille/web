import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { CreateDocumentButton } from './create-document-button';

describe('CreateDocumentButton', () => {
  it('forwards trigger props and ref to the underlying button', () => {
    const handlePointerEnter = vi.fn();
    const handleClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();

    render(
      <CreateDocumentButton
        ref={ref}
        ariaLabel="Create private document"
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
      />,
    );

    const button = screen.getByRole('button', { name: 'Create private document' });

    fireEvent.pointerEnter(button);
    fireEvent.click(button);

    expect(handlePointerEnter).toHaveBeenCalled();
    expect(handleClick).toHaveBeenCalled();
    expect(ref.current).toBe(button);
  });
});
