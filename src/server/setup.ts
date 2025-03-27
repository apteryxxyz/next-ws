import * as logger from 'next/dist/build/output/log.js';
import type NextNodeServer from 'next/dist/server/next-server.js';
import { WebSocketServer } from 'ws';
import { useHttpServer, useWebSocketServer } from './helpers/persistent';
import {
  getSocketHandler,
  importRouteModule,
  resolvePathToRoute,
} from './helpers/route';

export function setupWebSocketServer(nextServer: NextNodeServer) {
  process.env.NEXT_WS_MAIN_PROCESS = String(1);

  process.env.NEXT_WS_SKIP_ENVIRONMENT_CHECK = String(1);
  // @ts-expect-error - serverOptions is protected
  const httpServer = useHttpServer(nextServer.serverOptions?.httpServer);
  const wsServer = useWebSocketServer(new WebSocketServer({ noServer: true }));
  process.env.NEXT_WS_SKIP_ENVIRONMENT_CHECK = String(0);

  if (!httpServer)
    return logger.error('[next-ws] was not able to find the HTTP server');
  if (!wsServer)
    return logger.error('[next-ws] was not able to find the WebSocket server');

  logger.ready('[next-ws] has started the WebSocket server');

  httpServer.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url ?? '', 'ws://next');
    const pathname = url.pathname;
    if (pathname.includes('/_next')) return;

    const routeInfo = resolvePathToRoute(nextServer, pathname);
    if (!routeInfo) {
      logger.error(`[next-ws] could not find module for page ${pathname}`);
      return socket.destroy();
    }

    const routeModule = await importRouteModule(nextServer, routeInfo.filePath);
    if (!routeModule) {
      logger.error(`[next-ws] could not find module for page ${pathname}`);
      return socket.destroy();
    }

    const socketHandler = getSocketHandler(routeModule);
    if (!socketHandler || typeof socketHandler !== 'function') {
      logger.error(`[next-ws] ${pathname} does not export a SOCKET handler`);
      return socket.destroy();
    }

    return wsServer.handleUpgrade(request, socket, head, async (c, r) => {
      const routeContext = { params: routeInfo.routeParams };
      const handleClose = await socketHandler(c, r, wsServer, routeContext);
      if (typeof handleClose === 'function')
        c.once('close', () => handleClose());
    });
  });
}
