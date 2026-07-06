import '@testing-library/jest-dom/vitest';

import { mswServer } from './msw/server';

beforeAll(() => {
  mswServer.listen({
    onUnhandledRequest: 'error',
  });
});

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});
