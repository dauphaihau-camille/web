import { spawnSync } from 'node:child_process';

const targets = {
  app: {
    name: 'camille-web-app',
    paths: ['apps/app/', 'packages/shared/'],
  },
  marketing: {
    name: 'camille-web-marketing',
    paths: ['apps/marketing/', 'packages/shared/'],
  },
};

const globalBuildFiles = new Set([
  'bun.lock',
  'package.json',
  'turbo.json',
  'eslint.config.mjs',
]);

function usage() {
  return [
    'Usage: node ./scripts/netlify-ignore-build.mjs <app|marketing>',
    '',
    'Netlify ignore-build contract:',
    '  exit 0 = skip build',
    '  exit 1 = run build',
  ].join('\n');
}

function getTarget() {
  const targetName = process.argv[2];

  if (!targetName || !(targetName in targets)) {
    console.error(`Invalid deploy target: ${targetName ?? '(missing)'}`);
    console.error(usage());
    process.exit(1);
  }

  return targets[targetName];
}

function getChangedFiles(base, head) {
  const result = spawnSync('git', ['diff', '--name-only', base, head], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `Failed to compare ${base}..${head}`);
  }

  return result.stdout
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

function affectsTarget(file, target) {
  if (globalBuildFiles.has(file)) {
    return true;
  }

  return target.paths.some((path) => file.startsWith(path));
}

const target = getTarget();
const base = process.env.CACHED_COMMIT_REF;
const head = process.env.COMMIT_REF;

console.log(`Checking deploy impact for ${target.name}.`);
console.log(`Base: ${base ?? '(missing)'}`);
console.log(`Head: ${head ?? '(missing)'}`);

if (!base || !head) {
  console.log('Missing Netlify commit metadata; running build to be safe.');
  process.exit(1);
}

if (base === head) {
  console.log('Base and head are identical; running build to avoid skipping stale or retried deploy.');
  process.exit(1);
}

let changedFiles;

try {
  changedFiles = getChangedFiles(base, head);
}
catch (error) {
  console.log(error instanceof Error ? error.message : String(error));
  console.log('Unable to compute changed files; running build to be safe.');
  process.exit(1);
}

const relevantFiles = changedFiles.filter((file) => affectsTarget(file, target));

if (relevantFiles.length === 0) {
  console.log(`No deploy-impacting changes for ${target.name}; skipping build.`);
  process.exit(0);
}

console.log(`Deploy-impacting changes for ${target.name}:`);
for (const file of relevantFiles) {
  console.log(`- ${file}`);
}

process.exit(1);
