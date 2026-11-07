#!/usr/bin/env node
/**
 * Helpers for `.github/workflows/contract-update.yml`.
 *
 * `check` resolves the newest stable (non-prerelease) published version of the
 * contract package and compares it with the version pinned in `package.json`
 * using semver ordering. It writes `current`, `latest` and `newer` to
 * `GITHUB_OUTPUT` (when set) so the workflow can gate its later steps.
 *
 * `summary` renders the pull request body, naming both versions and describing
 * what `bun run generate:api-types` changed for the committed artifact.
 *
 * Both commands read only local files and `git diff`: the workflow itself
 * fetches the published version list with `npm view` and passes it in.
 * Node built-ins only — no extra dependencies.
 *
 * Usage:
 *   node ./scripts/check-contract-update.mjs check \
 *     --versions-file "$RUNNER_TEMP/api-spec-versions.json" \
 *     [--package-json package.json]
 *   node ./scripts/check-contract-update.mjs summary \
 *     --from 1.0.0 --to 1.1.0 --out "$RUNNER_TEMP/contract-pr-body.md"
 *
 * Exit codes: 0 success, 1 runtime failure, 2 usage error.
 */
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const CONTRACT_PACKAGE = '@dauphaihau-camille/api-spec';
const GENERATED_DIR = 'packages/shared/src/api/generated';
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const USAGE =
  'usage: check-contract-update.mjs <check|summary> [--flag value ...]\n' +
  '  check   --versions-file <path> [--package-json <path>]\n' +
  '  summary --from <version> --to <version> [--out <path>]';

function usageError(message) {
  console.error(`error: ${message}`);
  console.error(USAGE);
  process.exit(2);
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

/** `--flag value` pairs only; anything else is a typo worth failing on. */
function parseFlags(argv, allowed) {
  const flags = {};

  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];

    if (!name?.startsWith('--') || value === undefined) {
      usageError(`expected "--flag value" pairs, got "${name ?? ''}"`);
    }

    const key = name.slice(2);
    if (!allowed.includes(key)) {
      usageError(`unknown option --${key} (allowed: ${allowed.join(', ')})`);
    }
    if (key in flags) usageError(`duplicate option --${key}`);
    flags[key] = value;
  }

  return flags;
}

function requiredFlag(flags, key) {
  if (!flags[key]) usageError(`missing required option --${key}`);
  return flags[key];
}

function setOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

function appendStepSummary(markdown) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

/** Numeric semver, including prerelease precedence. Returns null when unparseable. */
function parseVersion(raw) {
  if (typeof raw !== 'string') return null;

  const match = SEMVER.exec(raw.trim());
  if (!match) return null;

  return {
    raw: raw.trim(),
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
  };
}

function comparePrerelease(left, right) {
  if (left.length === 0 && right.length === 0) return 0;
  // A version without a prerelease outranks one with a prerelease.
  if (left.length === 0) return 1;
  if (right.length === 0) return -1;

  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a === b) continue;

    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) return Number(a) - Number(b);
    if (aNumeric) return -1;
    if (bNumeric) return 1;
    return a < b ? -1 : 1;
  }

  return 0;
}

function compareVersions(left, right) {
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] - right[key];
  }

  return comparePrerelease(left.prerelease, right.prerelease);
}

function readPinnedVersion(packageJsonPath) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  }
  catch (error) {
    fail(`could not read ${packageJsonPath}: ${error.message}`);
  }

  const pinned =
    manifest.devDependencies?.[CONTRACT_PACKAGE] ?? manifest.dependencies?.[CONTRACT_PACKAGE];

  if (!pinned) {
    fail(`${CONTRACT_PACKAGE} is not declared in ${packageJsonPath}`);
  }

  if (parseVersion(pinned) === null) {
    fail(
      `${CONTRACT_PACKAGE} must be pinned to an exact version in ${packageJsonPath}, found "${pinned}"`,
    );
  }

  return pinned.trim();
}

function readPublishedVersions(versionsFile) {
  let payload;
  try {
    payload = JSON.parse(readFileSync(versionsFile, 'utf8'));
  }
  catch (error) {
    fail(`could not read ${versionsFile}: ${error.message}`);
  }

  // `npm view <pkg> versions --json` prints an array; a package with a single
  // version prints a bare string. Registry errors print an object.
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const detail = typeof payload.error === 'string'
      ? payload.error
      : payload.error
        ? JSON.stringify(payload.error)
        : (payload.message ?? JSON.stringify(payload));
    fail(`registry lookup failed: ${detail}`);
  }

  const list = Array.isArray(payload) ? payload : [payload];

  return list.filter((entry) => typeof entry === 'string');
}

function runCheck(flags) {
  const versionsFile = requiredFlag(flags, 'versions-file');
  const packageJsonPath = flags['package-json'] ?? 'package.json';

  const currentRaw = readPinnedVersion(packageJsonPath);
  const current = parseVersion(currentRaw);

  const published = readPublishedVersions(versionsFile);
  const stable = [];
  const ignored = [];

  for (const raw of published) {
    const parsed = parseVersion(raw);

    if (parsed === null) {
      ignored.push({ raw, reason: 'not semver' });
      continue;
    }

    if (parsed.prerelease.length > 0) {
      ignored.push({ raw, reason: 'prerelease' });
      continue;
    }

    stable.push(parsed);
  }

  if (stable.length === 0) {
    fail(
      `no stable versions of ${CONTRACT_PACKAGE} in ${versionsFile} (saw ${published.length} entries)`,
    );
  }

  const latest = stable.reduce((best, candidate) =>
    compareVersions(candidate, best) > 0 ? candidate : best,
  );
  const newer = compareVersions(latest, current) > 0;

  const prereleaseCount = ignored.filter((entry) => entry.reason === 'prerelease').length;

  log(`Contract package: ${CONTRACT_PACKAGE}`);
  log(`Pinned in ${packageJsonPath}: ${currentRaw}`);
  log(
    `Published versions: ${published.length} total, ${stable.length} stable, ` +
      `${prereleaseCount} prerelease ignored` +
      (ignored.length > prereleaseCount ? `, ${ignored.length - prereleaseCount} not semver` : ''),
  );
  log(`Newest stable: ${latest.raw}`);

  if (ignored.length > 0) {
    log(`Ignored: ${ignored.map((entry) => `${entry.raw} (${entry.reason})`).join(', ')}`);
  }

  log(
    newer
      ? `Decision: bump ${currentRaw} -> ${latest.raw}`
      : `Decision: already current, ${latest.raw} is not newer than ${currentRaw}`,
  );

  setOutput('current', currentRaw);
  setOutput('latest', latest.raw);
  setOutput('newer', String(newer));

  appendStepSummary(
    [
      '### Contract update check',
      '',
      `- Pinned: \`${currentRaw}\``,
      `- Newest stable published: \`${latest.raw}\``,
      `- Action: ${newer ? `bump to \`${latest.raw}\`` : 'nothing to do'}`,
      prereleaseCount > 0
        ? `- Prereleases ignored: ${ignored
          .filter((entry) => entry.reason === 'prerelease')
          .map((entry) => `\`${entry.raw}\``)
          .join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

function gitDiffGenerated() {
  try {
    return execFileSync('git', ['diff', '--no-color', '--unified=0', '--', GENERATED_DIR], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
  }
  catch (error) {
    fail(`git diff ${GENERATED_DIR} failed: ${error.message}`);
  }
}

function documentedPaths(line) {
  const paths = new Set();

  for (const match of line.matchAll(/"(\/[^"\\]*)"/g)) {
    paths.add(match[1]);
  }

  return paths;
}

function describeGeneratedChanges(diff) {
  const files = new Map();
  const addedPaths = new Set();
  const removedPaths = new Set();
  let currentFile = null;

  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      const path = line.slice(4).trim().replace(/^b\//, '');
      currentFile = path === '/dev/null' ? currentFile : path;
      if (currentFile && !files.has(currentFile)) files.set(currentFile, { added: 0, removed: 0 });
      continue;
    }

    if (line.startsWith('--- ') || line.startsWith('@@') || line.startsWith('\\')) continue;
    if (!currentFile) continue;

    const counts = files.get(currentFile);
    if (line.startsWith('+')) {
      counts.added += 1;
      for (const path of documentedPaths(line)) addedPaths.add(path);
    }
    else if (line.startsWith('-')) {
      counts.removed += 1;
      for (const path of documentedPaths(line)) removedPaths.add(path);
    }
  }

  const changedFiles = [...files.entries()].filter(
    ([, counts]) => counts.added > 0 || counts.removed > 0,
  );
  const added = changedFiles.reduce((total, [, counts]) => total + counts.added, 0);
  const removed = changedFiles.reduce((total, [, counts]) => total + counts.removed, 0);

  return {
    changed: changedFiles.length > 0,
    files: changedFiles.map(([path, counts]) => ({ path, ...counts })),
    added,
    removed,
    addedPaths: [...addedPaths].sort(),
    removedPaths: [...removedPaths].sort(),
  };
}

function formatPaths(paths, verb) {
  if (paths.length === 0) return null;

  const shown = paths.slice(0, 15).map((path) => `\`${path}\``);
  const extra = paths.length > shown.length ? ` (+${paths.length - shown.length} more)` : '';

  return `- Paths ${verb}: ${shown.join(', ')}${extra}`;
}

function renderBody({ from, to, changes }) {
  const lines = [
    `## Contract \`${CONTRACT_PACKAGE}\` ${from} → ${to}`,
    '',
    'Opened automatically by `.github/workflows/contract-update.yml` with the repository',
    '`GITHUB_TOKEN` (no bot app). The version is pinned exactly in `package.json` and',
    '`bun.lock`; prereleases are never adopted.',
    '',
    '### Generated API types',
    '',
  ];

  if (changes.changed) {
    const fileList = changes.files
      .map((file) => `- \`${file.path}\` (+${file.added}/−${file.removed})`)
      .join('\n');

    lines.push(
      `Changed — ${changes.files.length} file(s), +${changes.added}/−${changes.removed} lines:`,
      '',
      fileList,
    );

    const added = formatPaths(changes.addedPaths, 'added');
    const removed = formatPaths(changes.removedPaths, 'removed');
    if (added) lines.push('', added);
    if (removed) lines.push(removed);
  }
  else {
    lines.push(
      'Unchanged — the pinned contract version moved but the published `openapi.json`',
      `produces identical types for \`${GENERATED_DIR}/\`.`,
    );
  }

  lines.push(
    '',
    '### What CI covers',
    '',
    '- `bun run generate:api-types -- --check` passes on this branch (verified by the workflow).',
    '- `ci.yml` is dispatched on this branch after the PR opens and runs the generated-types',
    '  check plus lint, typecheck, tests and builds for every app. If no run appears, start it',
    '  from the Actions tab.',
    '',
    'Read the generated diff before merging: major bumps change types and can break callers.',
    'This workflow never merges and never publishes.',
    '',
  );

  return lines.join('\n');
}

function runSummary(flags) {
  const from = requiredFlag(flags, 'from');
  const to = requiredFlag(flags, 'to');

  if (parseVersion(from) === null) usageError(`--from is not a semver version: "${from}"`);
  if (parseVersion(to) === null) usageError(`--to is not a semver version: "${to}"`);

  const out = flags.out ? resolve(flags.out) : null;

  const changes = describeGeneratedChanges(gitDiffGenerated());
  const body = renderBody({ from, to, changes });

  log(
    changes.changed
      ? `Generated types changed: ${changes.files.length} file(s), +${changes.added}/−${changes.removed}`
      : 'Generated types unchanged',
  );

  if (out) {
    writeFileSync(out, body);
    log(`Wrote pull request body to ${out}`);
  }
  else {
    process.stdout.write(body);
  }
}

function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (command === 'check') {
    runCheck(parseFlags(rest, ['versions-file', 'package-json']));
    return;
  }

  if (command === 'summary') {
    runSummary(parseFlags(rest, ['from', 'to', 'out']));
    return;
  }

  usageError(command ? `unknown command "${command}"` : 'missing command');
}

main();
