import '@testing-library/jest-dom/vitest';

import { mswServer } from './msw/server';

if (!globalThis.localStorage) {
  const values = new Map<string, string>();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      get length() {
        return values.size;
      },
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
}

if (typeof document !== 'undefined' && !document.elementFromPoint) {
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: () => document.body,
  });
}

// jsdom does not implement ResizeObserver. Components that observe layout
// (for example the AI chat composer dock) must not crash in tests, so provide
// a no-op implementation; assertions still read layout from the DOM.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub implements ResizeObserver {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  }

  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserverStub,
  });
}

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
