// @vitest-environment node
import {
  readdirSync,
  readFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  ASSERTED_OPERATIONS,
  operationKey,
} from './asserted-operations';

/**
 * Breadth guard for the contract suite.
 *
 * Every `ApiSuccess<path, method>` call site is an API operation the web app
 * actually consumes. If it has no response conformance assertion, contract
 * drift can slip through unnoticed, so this test fails until the operation is
 * asserted and registered in `ASSERTED_OPERATIONS`.
 */

const repoRoot = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../..',
);

const SCAN_ROOTS = [
  join(repoRoot, 'apps/app/src'),
  join(repoRoot, 'packages/shared/src'),
];

/** Build output and generated contract types are not call sites. */
const SKIPPED_DIRECTORIES: Record<string, true> = {
  node_modules: true,
  generated: true,
  '.next': true,
  dist: true,
};
const SOURCE_FILE = /\.(?:ts|tsx|mts)$/;
const TEST_FILE = /\.(?:test|spec)\.[^/]+$/;
const API_SUCCESS = /ApiSuccess\s*<\s*'([^']+)'\s*,\s*'([^']+)'/g;

interface UsedOperation {
  path: string;
  method: string;
  file: string;
}

function* walk(directory: string): Generator<string> {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES[entry.name]) continue;
      yield* walk(fullPath);
      continue;
    }

    if (!SOURCE_FILE.test(entry.name)) continue;
    if (TEST_FILE.test(entry.name)) continue;
    if (entry.name.endsWith('.d.ts')) continue;

    yield fullPath;
  }
}

/** Comments mention `ApiSuccess` in examples; only real type arguments count. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

function collectUsedOperations(): UsedOperation[] {
  const used = new Map<string, UsedOperation>();

  for (const root of SCAN_ROOTS) {
    for (const file of walk(root)) {
      const source = stripComments(readFileSync(file, 'utf8'));

      for (const match of source.matchAll(API_SUCCESS)) {
        const path = match[1];
        const method = match[2];
        const key = operationKey(path, method);

        if (!used.has(key)) {
          used.set(key, { path, method, file: relative(repoRoot, file) });
        }
      }
    }
  }

  return [...used.values()];
}

const usedOperations = collectUsedOperations();
const assertedKeys = new Set(
  ASSERTED_OPERATIONS.map(({ path, method }) => operationKey(path, method)),
);

describe('used operations', () => {
  it('finds ApiSuccess call sites to check', () => {
    expect(usedOperations.length).toBeGreaterThan(0);
  });

  it('registers each asserted operation once', () => {
    expect(assertedKeys.size).toBe(ASSERTED_OPERATIONS.length);
  });

  it('has a response conformance assertion for every used operation', () => {
    const missing = usedOperations
      .filter(({ path, method }) => !assertedKeys.has(operationKey(path, method)))
      .sort((a, b) => operationKey(a.path, a.method).localeCompare(
        operationKey(b.path, b.method),
      ));

    const details = missing
      .map(({ path, method, file }) =>
        `  - ${method.toUpperCase()} ${path} (used in ${file})`)
      .join('\n');

    expect(
      details,
      'Every operation the web calls needs a response conformance assertion. ' +
      'Add an ApiSuccess-based assertion for each operation below to the ' +
      'domain *.conformance.test.ts (and its DTO to CONTRACT_COVERAGE), then ' +
      'register the pair in ASSERTED_OPERATIONS ' +
      '(packages/shared/src/api/asserted-operations.ts).\n' +
      details,
    ).toBe('');
  });
});
