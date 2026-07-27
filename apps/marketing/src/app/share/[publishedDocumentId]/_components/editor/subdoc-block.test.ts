import {
  describe, expect, it, vi, 
} from 'vitest';

const createSubdocBlockMock = vi.hoisted(() => vi.fn((options: unknown) => options));

vi.mock('@shared/components/editor/create-subdoc-block', () => ({
  createSubdocBlock: createSubdocBlockMock,
}));

import { subdocBlock } from './subdoc-block';

describe('subdocBlock', () => {
  it('does not fall back to private workspace routes on public pages', () => {
    expect(createSubdocBlockMock).toHaveBeenCalledTimes(1);
    expect(subdocBlock).toBeDefined();

    const options = createSubdocBlockMock.mock.calls[0]?.[0] as {
      resolvePrivateHref: () => string | null;
    };

    expect(options.resolvePrivateHref()).toBeNull();
  });
});
