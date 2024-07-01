import fs from 'node:fs';
import path from 'node:path';
import logger from '~/helpers/logger';
import { findNextDirectory } from '~/helpers/next';
import { patchNextNodeServer } from './patch-1';
import { patchNextTypesPlugin } from './patch-2';

const RouterServerFilePath = path.join(
  findNextDirectory(),
  'dist/server/lib/router-server.js',
);

// If Next.js receives a WebSocket connection on a matched route, it will
// close it immediately. This patch prevents that from happening.
export function patchRouterServer() {
  logger.info(
    'Preventing Next.js from immediately closing WebSocket connections...',
  );

  let content = fs.readFileSync(RouterServerFilePath, 'utf8');

  if (content.includes('return socket.end();'))
    content = content.replace('return socket.end();', '');
  const toFind = /(\/\/ [a-zA-Z .]+\s+)socket\.end\(\);/;
  if (toFind.test(content)) content = content.replace(toFind, '');

  fs.writeFileSync(RouterServerFilePath, content);
}

export default Object.assign(
  () => {
    patchNextNodeServer();
    patchRouterServer();
    patchNextTypesPlugin();
  },
  {
    date: '2023-11-01' as const,
    supported: '>=13.5.1 <=14.2.4' as const,
  },
);
