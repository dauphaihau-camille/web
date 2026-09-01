import { render, screen } from '@testing-library/react';

import { PublishedDocumentBar } from './published-document-bar';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    rel,
    target,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
    href: string;
    rel?: string;
    target?: string;
  }) => (
    <a href={href} rel={rel} target={target} className={className}>
      {children}
    </a>
  ),
}));

describe('PublishedDocumentBar', () => {
  it('opens published paths on the marketing host', () => {
    render(<PublishedDocumentBar publishedPath="/share/published-doc" />);

    expect(screen.getByRole('link', { name: 'View site' })).toHaveAttribute(
      'href',
      'http://localhost:5101/share/published-doc',
    );
  });

  it('does not render without a published path', () => {
    const { container } = render(<PublishedDocumentBar />);

    expect(container).toBeEmptyDOMElement();
  });
});
