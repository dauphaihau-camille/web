import { HTTPError } from 'ky';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { apiPost } from './api-client';

describe('api-client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches JSON error payloads to HTTPError data', async () => {
    const errorPayload = {
      message: 'Workspace block limit reached.',
      code: 'workspace_block_limit_reached',
      plan: 'free',
      block_count: 1000,
      block_limit: 1000,
      upgrade_available: true,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(errorPayload), {
        status: 403,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    try {
      await apiPost('documents/document-1/commands/create-subdoc', {});
      throw new Error('Expected request to fail.');
    }
    catch (error) {
      expect(error).toBeInstanceOf(HTTPError);
      expect((error as HTTPError).data).toEqual(errorPayload);
    }
  });
});
