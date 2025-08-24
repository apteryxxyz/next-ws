import * as logger from 'next/dist/build/output/log.js';
import type NextNodeServer from 'next/dist/server/next-server.js';
import { WebSocketServer } from 'ws';
import { findMatchingRoute } from './helpers/match.js';
import { importRouteModule } from './helpers/module.js';
import { toNextRequest } from './helpers/request.js';
import { useHttpServer, useWebSocketServer } from './persistent.js';

export function setupWebSocketServer(nextServer: NextNodeServer) {
  const httpServer = //
    // @ts-expect-error - serverOptions is protected
    useHttpServer(() => nextServer.serverOptions?.httpServer);
  if (!httpServer)
    return logger.error('[next-ws] was not able to find the HTTP server');
  const wsServer = //
    useWebSocketServer(() => new WebSocketServer({ noServer: true }));

  logger.ready('[next-ws] has started the WebSocket server');

  // Prevent double-attaching
  const kInstalled = Symbol.for('next-ws.http-server.attached');
  if (Reflect.has(httpServer, kInstalled)) return;
  Reflect.set(httpServer, kInstalled, true);

  httpServer.on('upgrade', async (message, socket, head) => {
    const request = toNextRequest(message);

    const pathname = request.nextUrl.pathname;
    if (pathname.includes('/_next')) return;

    const route = findMatchingRoute(nextServer, pathname);
    if (!route) {
      logger.error(`[next-ws] could not find route for page ${pathname}`);
      return socket.end();
    }

    const module = await importRouteModule(nextServer, route.filename);
    if (!module) {
      logger.error(`[next-ws] could not import module for page ${pathname}`);
      return socket.end();
    }

    const handleUpgrade = module.userland.UPGRADE;
    const handleSocket = module.userland.SOCKET;
    if (
      (!handleUpgrade || typeof handleUpgrade !== 'function') &&
      (!handleSocket || typeof handleSocket !== 'function')
    ) {
      logger.error(`[next-ws] route '${pathname}' does not export a handler`);
      return socket.end();
    }
    if (handleSocket)
      logger.warnOnce(
        'DeprecationWarning: [next-ws] SOCKET is deprecated, use UPGRADE instead, see https://github.com/apteryxxyz/next-ws#-usage',
      );

    wsServer.handleUpgrade(message, socket, head, async (client) => {
      wsServer.emit('connection', client, message);

      try {
        const context = { params: route.params };
        if (handleUpgrade) {
          await handleUpgrade(client, wsServer, request, context);
        } else if (handleSocket) {
          const handleClose = //
            await handleSocket(client, message, wsServer, context);
          if (typeof handleClose === 'function')
            client.once('close', () => handleClose());
        }
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
