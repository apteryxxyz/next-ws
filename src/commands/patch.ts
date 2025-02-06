import { Command } from 'commander';
import logger from '~/commands/helpers/logger';
import * as semver from '~/commands/helpers/semver';
import patches from '~/patches';
import { getNextVersion, setTrace } from '~/patches/helpers/next';

export default new Command('patch')
  .description('Patch the local Next.js installation to support WebSockets')
  .option('-y, --yes', 'Skip confirmation prompt for unsupported versions')
  .action(async (options: { yes: boolean }) => {
    const supported = patches.map((p) => p.versions).join(' || ');
    const minimum = semver.minVersion(supported)?.version ?? supported;
    const maximum = semver.maxVersion(supported)?.version ?? supported;
    const current = await getNextVersion();

    if (semver.ltr(current, minimum)) {
      // The installed version is lower than the minimum supported version
      logger.error(`Next.js v${current} is not supported,
        a minimum of v${minimum} is required`);
      process.exit(1);
    }

    let patch = patches.find((p) => semver.satisfies(current, p.versions));
    if (semver.gtr(current, maximum)) {
      // The installed version is higher than the maximum supported version
      logger.warn(`Next.js v${current} is not officially supported,
        a maximum of v${maximum} is recommended.
        Are you sure you want to proceed?`);
      const confirm = options.yes || (await logger.confirm());

      if (confirm) {
        patch = patches[patches.length - 1];
        logger.info('Proceeding with the latest patch');
        logger.log(`If you encounter any issues please report them at
          https://github.com/apteryxxyz/next-ws/issues`);
      } else {
        logger.error('Aborted');
        process.exit(1);
      }
    }

    if (!patch) {
      logger.error(`Next.js v${current} is not supported,
        please upgrade to a version within the range '${supported}'`);
      process.exit(1);
    }

    logger.info(`Patching Next.js v${current} with '${patch.versions}'`);
    await patch.execute();

    logger.info('Saving patch trace file...');
    setTrace({ patch: patch.versions, version: current });

    logger.info('All done!');
  });
