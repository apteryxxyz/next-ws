import { createPatch, createPatchStep } from '~/patches/helpers/patch';
import {
  patchNextNodeServer as p1_patchNextNodeServer,
  patchNextTypesPlugin as p1_patchNextTypesPlugin,
} from './patch-1';

/**
 * Add `SOCKET?: Function` to the page module interface check field thing in
 * `next/dist/build/webpack/plugins/next-types-plugin.js`.
 * @remark The file for `next-types-plugin` was moved in 13.4.9
 */
export const patchNextTypesPlugin = createPatchStep({
  ...p1_patchNextTypesPlugin,
  path: 'next:dist/build/webpack/plugins/next-types-plugin/index.js',
  ignoreIf: 'SOCKET?: Function',
});

/**
 * Prevent Next.js from immediately closing WebSocket connections on matched routes.
 * @remark This patch is only necessary for Next.js versions greater than 13.5.1
 */
export const patchRouterServer = createPatchStep({
  title: 'Prevent Next.js from immediately closing WebSocket connections',
  path: 'next:dist/server/lib/router-server.js',
  modify(source) {
    const newSource = source
      .replace('return socket.end();', '')
      .replace(/(\/\/ [a-zA-Z .]+\s+)socket\.end\(\);/, '');
    return newSource;
  },
});

export default createPatch({
  name: 'patch-3',
  versions: '>=13.5.1 <=15.1.7',
  steps: [p1_patchNextNodeServer, patchRouterServer, patchNextTypesPlugin],
});
