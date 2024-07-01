import fs from 'node:fs';
import path from 'node:path';
import logger from '~/helpers/logger';
import { patchNextNodeServer } from './patch-1';
import { findNextDirectory } from '~/helpers/next';

const NextTypesFilePath = path.join(
  findNextDirectory(),
  'dist/build/webpack/plugins/next-types-plugin/index.js',
);

// Add `SOCKET?: Function` to the page module interface check field thing in
// `next/dist/build/webpack/plugins/next-types-plugin/index.js`
export function patchNextTypesPlugin() {
  logger.info("Adding 'SOCKET' to the page module interface type...");

  let content = fs.readFileSync(NextTypesFilePath, 'utf8');
  if (content.includes('SOCKET?: Function')) return;

  const toFind = '.map((method)=>`${method}?: Function`).join("\\n  ")';
  const replaceWith = `${toFind} + "; SOCKET?: Function"`;
  content = content.replace(toFind, replaceWith);

  fs.writeFileSync(NextTypesFilePath, content);
}

export default Object.assign(
  () => {
    patchNextNodeServer();
    patchNextTypesPlugin();
  },
  {
    date: '2023-07-15' as const,
    // The file for 'next-types-plugin' was moved in 13.4.9
    supported: '>=13.4.9 <=13.4.12' as const,
  },
);
