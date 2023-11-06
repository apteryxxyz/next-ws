import * as Log from 'next/dist/build/output/log';
import NextNodeServer from 'next/dist/server/next-server';
import { getPageModule, resolvePathname } from './utilities/next';
import { useHttpServer, useWsServer } from './utilities/server';

export function setupWebSocketServer(nextServer: NextNodeServer) {
  const httpServer = useHttpServer(nextServer);
  const wsServer = useWsServer();
  Log.ready('[next-ws] has started the WebSocket server');

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  httpServer.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url ?? '', 'ws://next');
    const pathname = url.pathname;

    // Ignore Next.js internal requests (aka HMR)
    if (pathname.startsWith('/_next')) return;

    // Resolve the pathname to a file system path (eg /about -> /about/route)
    const fsPathname = resolvePathname(nextServer, pathname);
    if (!fsPathname) {
      Log.error('[next-ws] could not resolve ${pathname} to a route');
      return socket.end();
    }

    // Get the page module for the pathname (aka require('/about/route'))
    const pageModule = await getPageModule(nextServer, fsPathname);
    if (!pageModule) {
      Log.error('[next-ws] could not find module for page ${pathname}');
      return socket.end();
    }

    const socketHandler = pageModule?.routeModule?.userland?.SOCKET;
    if (!socketHandler || typeof socketHandler !== 'function') {
      Log.error('[next-ws] ${pathname} does not export a SOCKET handler');
      return socket.end();
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
  Log.warnOnce(
    '[next-ws] is using a deprecated method of hooking into Next.js, this may break in future versions'
  );
  setupWebSocketServer(this);
}
