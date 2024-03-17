import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import { prompt } from 'inquirer';
import { patches } from '../patches';
import { log } from '../utilities/log';
import * as semver from '../utilities/semver';
import { findWorkspaceRoot } from '../utilities/workspace';

export default new Command('patch')
  .description('Patch the local Next.js installation to support WebSockets')
  .option('-y, --yes', 'Skip confirmation prompt for unsupported versions')
  .action(async (options: { yes: boolean }) => {
    const supported = patches.map((patch) => patch.supported).join(' || ');
    const minimum = semver.minVersion(supported)?.version ?? supported;
    const maximum = semver.maxVersion(supported)?.version ?? supported;
    const current = getCurrentNextVersion();

    if (semver.ltr(current, minimum)) {
      log.error(`Next.js v${current} is not supported,
        a minimum of v${minimum} is required`);
      process.exit(1);
    }

    let patch = patches.find((patch) =>
      semver.satisfies(current, patch.supported)
    );

    if (!patch && semver.gtr(current, maximum)) {
      log.warn(`Next WS has not yet been tested with Next.js v${current},
        it may or may not work, are you sure you want to continue?`);

      const confirm =
        Boolean(options.yes) ||
        (await prompt<{ confirm: boolean }>({
          type: 'confirm',
          name: 'confirm',
          message: 'Continue?',
          default: false,
        }).then((answer) => answer.confirm));

      if (confirm || process.env.FORCE_NEXT_WS_PATCH) {
        patch = patches[patches.length - 1];
        log.info('Continuing with the latest patch');
        log.info(`If you encounter any issues please report them at
          https://github.com/apteryxxyz/next-ws/issues`);
      } else {
        log.info('Aborting');
        process.exit(1);
      }
    }

    if (!patch) {
      log.error(`Next WS does not have a patch for Next.js v${current},
        please install a supported version of Next.js`);
      log.info(`Supported ranges: ${supported}`);
      process.exit(1);
    }

    log.info(`Patching Next.js v${current} with patch "${patch.supported}"...`);
    patch();

    log.info('Saving patch information file...');
    fs.writeFileSync(
      path.join(findWorkspaceRoot(), 'node_modules/next/.next-ws-trace.json'),
      JSON.stringify({ patch: patch.supported, version: current })
    );

    log.info(
      "All done! You can now install the core Next WS package if you haven't already"
    );
  });

function getCurrentNextVersion() {
  const packagePath = path.join(
    findWorkspaceRoot(),
    'node_modules/next/package.json'
  );

  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent) as { version: string };
  return packageJson.version.split('-')[0];
}
