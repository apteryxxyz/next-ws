import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import logger from '~/helpers/logger';
import { findNextDirectory } from '~/helpers/next';
import { patchNextNodeServer } from './patch-1';

// Add `SOCKET?: Function` to the page module interface check field thing in
// next/dist/build/webpack/plugins/next-types-plugin.js
// REMARK: The file for 'next-types-plugin' was moved in 13.4.9

const NextTypesFilePath = join(
  findNextDirectory(),
  'dist/build/webpack/plugins/next-types-plugin/index.js',
);

export async function patchNextTypesPlugin() {
  logger.info("Adding 'SOCKET' to the page module interface type...");

  const source = await readFile(NextTypesFilePath, 'utf8');
  if (source.includes('SOCKET?: Function'))
    return logger.warn(
      "'SOCKET' already exists in page module interface, skipping.",
    );

  const toFind =
    /\.map\(\(method\)=>`\${method}\?: Function`\).join\(['"]\\n +['"]\)/;
  const replaceWith = `.map((method)=>\`\${method}?: Function\`).join('\\n  ') + "; SOCKET?: Function"`;
  const newSource = source.replace(toFind, replaceWith);
  if (!newSource.includes('SOCKET?: Function'))
    throw 'Failed to add SOCKET to page module interface type.';

  await writeFile(NextTypesFilePath, newSource);
  logger.info("'SOCKET' added to page module interface type.");
}

//

export default Object.assign(
  async () => {
    await patchNextNodeServer();
    await patchNextTypesPlugin();
  },
  {
    date: '2023-06-16' as const,
    supported: '>=13.1.1 <=13.4.8' as const,
  },
);
