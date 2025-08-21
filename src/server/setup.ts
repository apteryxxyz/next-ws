import type { IncomingMessage } from 'node:http';
import { deprecate } from 'node:util';
import * as logger from 'next/dist/build/output/log.js';
import type NextNodeServer from 'next/dist/server/next-server';
import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';
import { useHttpServer, useWebSocketServer } from './persistent';
import { findMatchingRoute } from './route/match';
import { importRouteModule } from './route/module';
import { createRequestStore, createWorkStore } from './route/store';

export const setupWebSocketServer = deprecate(
  (nextServer: NextNodeServer) => attachWebSocketUpgradeHandler({ nextServer }),
  '[next-ws] setupWebSocketServer is deprecated, you may need to repatch your installation',
);

export function attachWebSocketUpgradeHandler({
  nextServer,
}: { nextServer: NextNodeServer }) {
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

  //

  httpServer.on('upgrade', async (message, socket, head) => {
    const request = toNextRequest(message);
    const pathname = request.nextUrl.pathname;

    // Filter out internal requests
    if (pathname.includes('/_next')) return;

    const route = findMatchingRoute(nextServer, pathname);
    if (!route) {
      logger.warnOnce(`[next-ws] no matching route for '${pathname}'`);
      return socket.destroy();
    }
    const module = await importRouteModule(nextServer, route.filename);

    const handleSocket = module.userland.SOCKET;
    if (!handleSocket || typeof handleSocket !== 'function') {
      logger.error(
        `[next-ws] route '${pathname}' does not export a valid 'SOCKET' handler`,
      );
      return socket.destroy();
    }

    // Currently experimental, but will eventually become stable then the default
    let asyncContext = module.userland.experimental_socketAsyncContext;
    if (
      typeof asyncContext !== 'undefined' &&
      typeof asyncContext !== 'boolean'
    ) {
      logger.warnOnce(
        `[next-ws] route '${pathname}' has invalid 'asyncContext' boolean, falling back to Boolean(asyncContext)`,
      );
      asyncContext = Boolean(asyncContext);
    }

    wsServer.handleUpgrade(message, socket, head, async (client) => {
      const handler = async () => {
        const context = { params: route.params };
        const args = asyncContext
          ? [client, wsServer, request, context]
          : [client, message, wsServer, context];

        // @ts-ignore - overloaded function
        const handleClose = await handleSocket(...args);
        if (typeof handleClose === 'function')
          client.once('close', () => handleClose());
      };

      if (asyncContext) {
        const workStore = createWorkStore(nextServer, route.filename);
        const requestStore = createRequestStore(nextServer, request);

        await module.workAsyncStorage.run(workStore, () =>
          module.workUnitAsyncStorage.run(requestStore, handler),
        );
      } else {
        await handler();
      }
    });

    return;
  });

  return;
}

function toNextRequest(message: IncomingMessage) {
  const controller = new AbortController();
  const headers = new Headers(message.headers as never);
  const protocol = 'encrypted' in message.socket ? 'https' : 'http';
  const url = `${protocol}://${headers.get('host')}${message.url}`;

  message.once('aborted', () => controller.abort());

  return new NextRequest(url, {
    method: message.method,
    headers: headers,
    body:
      message.method === 'GET' || message.method === 'HEAD'
        ? undefined
        : (message as unknown as ReadableStream<Uint8Array>),
    signal: controller.signal,
    referrer: headers.get('referrer') || undefined,
  });
}
