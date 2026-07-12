type DeployTarget = 'app' | 'marketing';

type TargetConfig = {
  packageName: string;
};

const TARGETS: Record<DeployTarget, TargetConfig> = {
  app: {
    packageName: 'camille-web-app',
  },
  marketing: {
    packageName: 'camille-web-marketing',
  },
};

type TurboDryRun = {
  tasks?: Array<{
    taskId?: string;
    package?: string;
    task?: string;
  }>;
};

function usage() {
  return [
    'Usage: bun scripts/netlify-ignore-build.ts <app|marketing> [--base <ref>]',
    '',
    'Netlify ignore-build contract:',
    '  exit 0 = skip build',
    '  exit 1 = run build',
  ].join('\n');
}

function parseArgs(argv: string[]) {
  const [targetName, ...rest] = argv;
  const target = targetName as DeployTarget | undefined;
  let base = process.env.CACHED_COMMIT_REF;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === '--base') {
      base = rest[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!target || !(target in TARGETS)) {
    throw new Error(`Invalid deploy target: ${targetName ?? '(missing)'}`);
  }

  return { target, base };
}

async function getTurboDryRun(packageName: string, base: string) {
  const filter = `${packageName}...[${base}]`;
  const command = [
    'bun',
    'turbo',
    'run',
    'build',
    `--filter=${filter}`,
    '--dry=json',
  ];
  const process = Bun.spawn(command, {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(stderr.trim() || `Turbo affected query failed for ${filter}.`);
  }

  return JSON.parse(stdout) as TurboDryRun;
}

function includesTargetBuild(dryRun: TurboDryRun, packageName: string) {
  return dryRun.tasks?.some((task) => task.package === packageName && task.task === 'build') ?? false;
}

async function main() {
  let target: DeployTarget;
  let base: string | undefined;

  try {
    ({ target, base } = parseArgs(Bun.argv.slice(2)));
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(usage());
    process.exit(1);
  }

  if (!base) {
    console.log('Missing CACHED_COMMIT_REF; running build to be safe.');
    process.exit(1);
  }

  const { packageName } = TARGETS[target];
  let dryRun: TurboDryRun;

  try {
    console.log(`Checking Turbo affected graph for ${packageName} since ${base}.`);
    dryRun = await getTurboDryRun(packageName, base);
  }
  catch (error) {
    console.log(error instanceof Error ? error.message : String(error));
    console.log('Unable to compute Turbo affected graph; running build to be safe.');
    process.exit(1);
  }

  if (!includesTargetBuild(dryRun, packageName)) {
    console.log(`Turbo found no deploy-impacting changes for ${packageName}; skipping build.`);
    process.exit(0);
  }

  console.log(`Turbo found deploy-impacting changes for ${packageName}; running build.`);
  process.exit(1);
}

await main();
