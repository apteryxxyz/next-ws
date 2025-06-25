import { definePatch, definePatchStep } from './helpers/define';
import {
  patchNextNodeServer as p1_patchNextNodeServer,
  patchNextTypesPlugin as p1_patchNextTypesPlugin,
} from './patch-1';

/**
 * Add `SOCKET?: Function` to the page module interface check field thing in
 * `next/dist/build/webpack/plugins/next-types-plugin.js`.
 * @remark The file for `next-types-plugin` was moved in 13.4.9
 */
export const patchNextTypesPlugin = definePatchStep({
  ...p1_patchNextTypesPlugin,
  path: 'next:dist/build/webpack/plugins/next-types-plugin/index.js',
});

/**
 * Prevent Next.js from immediately closing WebSocket connections on matched routes.
 * @remark This patch is only necessary for Next.js versions greater than 13.5.1
 */
export const patchRouterServer = definePatchStep({
  title: 'Prevent Next.js from immediately closing WebSocket connections',
  path: 'next:dist/server/lib/router-server.js',
  async modify(source) {
    const newSource = source
      .replaceAll('return socket.end();', '')
      .replaceAll(/(\/\/ [a-zA-Z .]+\s+)socket\.end\(\);/g, '');
    return newSource;
  },
});

export default definePatch({
  name: 'patch-2',
  versions: '>=13.5.1 <=15.3.4',
  steps: [p1_patchNextNodeServer, patchRouterServer, patchNextTypesPlugin],
});
