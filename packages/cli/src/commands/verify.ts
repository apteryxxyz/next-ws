import { Command } from 'commander';
import logger from '~/helpers/logger';
import { getNextVersion } from '~/helpers/next';
import { getTrace } from '~/helpers/trace';
import patchCommand from './patch';

export default new Command('verify')
  .description('Verify that the local Next.js installation has been patched')
  .option('-e, --ensure', 'If not patched, then run the patch command')
  .action((options: { ensure: boolean }) => {
    const trace = getTrace();
    if (!trace) {
      if (options.ensure) {
        logger.warn(
          'Next.js has not been patched, running `npx next-ws-cli@latest patch`...',
        );

        const action = Reflect.get(patchCommand, '_actionHandler');
        return action(['-y']);
      } else {
        logger.error(
          'Next.js has not been patched, try running `npx next-ws-cli@latest patch`',
        );
        process.exit(1);
      }
    }

    const current = getNextVersion();
    if (trace.version !== current) {
      logger.error(
        `Next.js version mismatch, expected v${trace.version} but found v${current}, try running \`npx next-ws-cli@latest patch\``,
      );
      process.exit(1);
    }

    logger.info(`Next.js has been patched with "${trace.patch}"`);
  });
