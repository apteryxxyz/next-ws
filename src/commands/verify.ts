import { Command } from 'commander';
import { getNextVersion, getTrace } from '~/patches/helpers/next';
import logger from './helpers/logger';
import patchCommand from './patch';

export default new Command('verify')
  .description('Verify that the local Next.js installation has been patched')
  .option('-e, --ensure', 'If not patched, then run the patch command')
  .action(async (options: { ensure: boolean }) => {
    const trace = await getTrace();
    if (!trace) {
      if (options.ensure) {
        logger.warn(`Next.js has not been patched,
          running the patch command`);
        const action = Reflect.get(patchCommand, '_actionHandler');
        return action(['-y']);
      } else {
        logger.error(`Next.js has not been patched,
          you'll need to run the patch command`);
        process.exit(1);
      }
    }

    const current = await getNextVersion();
    if (current !== trace.version) {
      logger.error(`Next.js has been patched with a different version,
        you'll need to run the patch command`);
      process.exit(1);
    }

    logger.info('Next.js is patched');
  });
