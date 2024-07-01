import confirm from '@inquirer/confirm';
import { Command } from 'commander';
import logger from '~/helpers/logger';
import { getNextVersion } from '~/helpers/next';
import { setTrace } from '~/helpers/trace';
import patches from '~/patches';
import * as semver from '../helpers/semver';

export default new Command('patch')
  .description('Patch the local Next.js installation to support WebSockets')
  .option('-y, --yes', 'Skip confirmation prompt for unsupported versions')
  .action(async (options: { yes: boolean }) => {
    const supported = patches.map((p) => p.supported).join(' || ');
    const minimum = semver.minVersion(supported)?.version ?? supported;
    const maximum = semver.maxVersion(supported)?.version ?? supported;
    const current = getNextVersion();

    if (semver.ltr(current, minimum)) {
      logger.error(`Next.js v${current} is not supported,
        a minimum of v${minimum} is required`);
      process.exit(1);
    }

    let patch = patches.find((p) => semver.satisfies(current, p.supported));
    if (patch && semver.gtr(current, maximum)) {
      logger.warn(`Next WS has not yet been tested with Next.js v${current},
        it may or may not work, are you sure you want to continue?`);

      const continueY =
        Boolean(options.yes) ||
        (await confirm({
          message: 'Continue?',
          default: false,
        }));

      if (continueY) {
        patch = patches[patches.length - 1];
        logger.info('Continuing with the latest patch');
        logger.info(`If you encounter any issues please report them at
          https://github.com/apteryxxyz/next-ws/issues`);
      } else {
        logger.info('Aborting');
        process.exit(1);
      }
    }

    if (!patch) {
      logger.error(`Next WS does not have a patch for Next.js v${current},
        please install a supported version of Next.js`);
      logger.info(`Supported ranges: ${supported}`);
      process.exit(1);
    }

    logger.info(
      `Patching Next.js v${current} with patch "${patch.supported}"...`,
    );
    patch();

    logger.info('Saving patch information file...');
    setTrace({ patch: patch.supported, version: current });

    logger.info(
      "All done! You can now install the core Next WS package if you haven't already",
    );
  });
