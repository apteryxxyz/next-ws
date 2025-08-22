import * as logger from 'next/dist/build/output/log.js';
import type NextNodeServer from 'next/dist/server/next-server.js';
import { WebSocketServer } from 'ws';
import { findMatchingRoute } from './helpers/match.js';
import { importRouteModule } from './helpers/module.js';
import { useHttpServer, useWebSocketServer } from './persistent.js';

export function setupWebSocketServer(nextServer: NextNodeServer) {
  process.env.NEXT_WS_MAIN_PROCESS = String(1);

  process.env.NEXT_WS_SKIP_ENVIRONMENT_CHECK = String(1);
  const httpServer = //
    // @ts-expect-error - serverOptions is protected
    useHttpServer(() => nextServer.serverOptions?.httpServer);
  if (!httpServer)
    return logger.error('[next-ws] was not able to find the HTTP server');
  const wsServer = //
    useWebSocketServer(() => new WebSocketServer({ noServer: true }));
  if (!wsServer)
    return logger.error('[next-ws] was not able to find the WebSocket server');
  process.env.NEXT_WS_SKIP_ENVIRONMENT_CHECK = String(0);

  logger.ready('[next-ws] has started the WebSocket server');

  // Prevent double-attaching
  const kInstalled = Symbol.for('kInstalled');
  if (Reflect.has(httpServer, kInstalled)) return;
  Reflect.set(httpServer, kInstalled, true);

  httpServer.on('upgrade', async (message, socket, head) => {
    const url = new URL(message.url ?? '', 'ws://next');
    const pathname = url.pathname;
    if (pathname.includes('/_next')) return;

    const route = findMatchingRoute(nextServer, pathname);
    if (!route) {
      logger.error(`[next-ws] could not find module for page ${pathname}`);
      return socket.end();
    }
    const module = await importRouteModule(nextServer, route.filename);

    const handleSocket = module.userland.SOCKET;
    if (!handleSocket || typeof handleSocket !== 'function') {
      logger.error(
        `[next-ws] route '${pathname}' does not export a valid 'SOCKET' handler`,
      );
      return socket.end();
    }

    wsServer.handleUpgrade(message, socket, head, async (client) => {
      wsServer.emit('connection', client, message);

      try {
        const context = { params: route.params };
        const handleClose = //
          await handleSocket(client, message, wsServer, context);
        if (typeof handleClose === 'function')
          client.once('close', () => handleClose());
      } catch (cause) {
        logger.error(
          `[next-ws] error in socket handler for '${pathname}'`,
          cause,
        );
        try {
          client.close(1011, 'Internal Server Error');
        } catch {}
      }
    });

    return;
  });
}
