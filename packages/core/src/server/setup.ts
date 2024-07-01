import * as logger from 'next/dist/build/output/log';
import type NextNodeServer from 'next/dist/server/next-server';
import { WebSocketServer } from 'ws';
import { getPageModule, resolveFilename } from './helpers/next';
import { useHttpServer, useWebSocketServer } from './helpers/persistent';

export function setupWebSocketServer(nextServer: NextNodeServer) {
  process.env.NEXT_WS_MAIN_PROCESS = String(1);

  process.env.NEXT_WS_SKIP_ENVIRONMENT_CHECK = String(1);
  // @ts-expect-error - serverOptions is protected
  const httpServer = useHttpServer(nextServer.serverOptions?.httpServer);
  const wsServer = useWebSocketServer(new WebSocketServer({ noServer: true }));
  // biome-ignore lint/performance/noDelete: <explanation>
  delete process.env.NEXT_WS_SKIP_ENVIRONMENT_CHECK;

  if (!httpServer)
    return logger.error('[next-ws] was not able to find the HTTP server');
  if (!wsServer)
    return logger.error('[next-ws] was not able to find the WebSocket server');

  logger.ready('[next-ws] has started the WebSocket server');

  httpServer.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url ?? '', 'ws://next');
    const pathname = url.pathname;
    if (pathname.startsWith('/_next')) return;

    const filename = resolveFilename(nextServer, pathname);
    if (!filename) {
      logger.error(`[next-ws] could not find module for page ${pathname}`);
      return socket.destroy();
    }

    const pageModule = await getPageModule(nextServer, filename);
    if (!pageModule) {
      logger.error(`[next-ws] could not find module for page ${pathname}`);
      return socket.destroy();
    }

    const socketHandler = pageModule?.routeModule?.userland?.SOCKET;
    if (!socketHandler || typeof socketHandler !== 'function') {
      logger.error(`[next-ws] ${pathname} does not export a SOCKET handler`);
      return socket.destroy();
    }

    return wsServer.handleUpgrade(request, socket, head, (c, r) => {
      const dispose = socketHandler(c, r, wsServer);
      if (typeof dispose === 'function') c.once('close', () => dispose());
    });
  });
}

// Next WS versions below 0.2.0 used a different method of setup
// This remains for backwards compatibility, but may be removed in a future version
export function hookNextNodeServer(this: NextNodeServer) {
  setupWebSocketServer(this);
}
