import * as Log from 'next/dist/build/output/log';
import type NextNodeServer from 'next/dist/server/next-server';
import {
  getHttpServer,
  getPageModule,
  resolvePathname,
} from './utilities/next';
import { getWsServer } from './utilities/ws';

export function setupWebSocketServer(nextServer: NextNodeServer) {
  const httpServer = getHttpServer(nextServer);
  const wsServer = getWsServer();
  Log.ready('[next-ws] websocket server started successfully');

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  httpServer.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url ?? '', 'ws://next');
    const pathname = url.pathname;
    if (pathname.startsWith('/_next')) return;

    const fsPathname = resolvePathname(nextServer, pathname);
    if (!fsPathname) {
      Log.error(`[next-ws] could not find module for page ${pathname}`);
      return socket.destroy();
    }

    const pageModule = await getPageModule(nextServer, fsPathname);
    if (!pageModule) {
      Log.error(`[next-ws] could not find module for page ${pathname}`);
      return socket.destroy();
    }

    const socketHandler = pageModule?.routeModule?.userload?.SOCKET;
    if (!socketHandler || typeof socketHandler !== 'function') {
      Log.error(`[next-ws] ${pathname} does not export a SOCKET handler`);
      return socket.destroy();
    }

    return wsServer.handleUpgrade(
      request,
      socket,
      head,
      (client, request) => void socketHandler(client, request, wsServer)
    );
  });
}

// Next WS versions below 0.2.0 used a different method of setup
// This remains for backwards compatibility, but may be removed in a future version
export function hookNextNodeServer(this: NextNodeServer) {
  setupWebSocketServer(this);
}
