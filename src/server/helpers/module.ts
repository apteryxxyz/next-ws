import * as logger from 'next/dist/build/output/log.js';
import type NextNodeServer from 'next/dist/server/next-server.js';
import type { SocketHandler } from './socket.js';

export async function importRouteModule(
  nextServer: NextNodeServer,
  filePath: string,
) {
  try {
    // CHANGE(next@14): hotReloader was removed and ensurePage was moved to NextNodeServer
    if ('hotReloader' in nextServer) {
      // @ts-expect-error - hotReloader only exists in Next.js 13
      await nextServer.hotReloader?.ensurePage({
        page: filePath,
        clientOnly: false,
      });
    } else if ('ensurePage' in nextServer) {
      // ensurePage throws an error in production, so we need to catch it
      // @ts-expect-error - ensurePage is protected
      await nextServer.ensurePage({ page: filePath, clientOnly: false });
    } else {
      // Future-proofing
      logger.warnOnce(
        '[next-ws] unable to ensure page, you may need to open the route in your browser first so Next.js compiles it',
      );
    }
  } catch {}

  // @ts-expect-error - getPageModule is protected
  const buildPagePath = nextServer.getPagePath(filePath);
  return require(buildPagePath).routeModule as RouteModule;
}

export interface RouteModule {
  userland: { SOCKET?: SocketHandler };
}
