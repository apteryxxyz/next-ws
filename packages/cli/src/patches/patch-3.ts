import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import logger from '~/helpers/logger';
import { findNextDirectory } from '~/helpers/next';
import { patchNextNodeServer } from './patch-1';
import { patchNextTypesPlugin } from './patch-2';

// If Next.js receives a WebSocket connection on a matched route, it will
// close it immediately. This patch prevents that from happening.
// REMARK: This patch is only necessary for Next.js versions greater than 13.5.1

const RouterServerFilePath = join(
  findNextDirectory(),
  'dist/server/lib/router-server.js',
);

export async function patchRouterServer() {
  logger.info(
    'Preventing Next.js from immediately closing WebSocket connections...',
  );

  const source = await readFile(RouterServerFilePath, 'utf8');
  const newSource = source
    .replace('return socket.end();', '')
    .replace(/(\/\/ [a-zA-Z .]+\s+)socket\.end\(\);/, '');

  await writeFile(RouterServerFilePath, newSource);
  logger.info('WebSocket connection closing prevention patch applied.');
}

export default Object.assign(
  async () => {
    await patchNextNodeServer();
    await patchRouterServer();
    await patchNextTypesPlugin();
  },
  {
    date: '2023-11-01' as const,
    supported: '>=13.5.1 <=15.0.4' as const,
  },
);
