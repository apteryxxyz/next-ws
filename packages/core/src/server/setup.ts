import path from 'node:path';
import * as Log from 'next/dist/build/output/log';
import NextNodeServer from 'next/dist/server/next-server';
import { WebSocketServer } from 'ws';
import {
    type SocketHandler,
    getHttpServer,
    getPageModule,
    resolvePathname,
} from './utilities/next';

export function setupWebSocketServer(nextServer: NextNodeServer) {
    const httpServer = getHttpServer(nextServer);
    const wsServer = new WebSocketServer({ noServer: true });
    Log.ready('[next-ws] websocket server started successfully');

    httpServer.on('upgrade', async (request, socket, head) => {
        const url = new URL(request.url ?? '', 'http://next-ws');
        const pathname = await resolvePathname(nextServer, url.pathname);
        if (!pathname) return;

        const fsPathname = path
            .join(pathname, 'route')
            .replaceAll(path.sep, '/');
        const pageModule = await getPageModule(nextServer, fsPathname);
        if (!pageModule)
            return Log.error(
                `[next-ws] could not find module for page ${pathname}`
            );

        const socketHandler: SocketHandler | undefined =
            pageModule?.routeModule?.userland?.SOCKET;
        if (!socketHandler || typeof socketHandler !== 'function')
            return Log.error(
                `[next-ws] could not find SOCKET handler for page ${pathname}`
            );

        wsServer.handleUpgrade(request, socket, head, (client, request) => {
            socketHandler(client, request, wsServer);
        });
    });
}

// Next WS versions below 0.2.0 used a different method of setup
// This remains for backwards compatibility, but may be removed in a future version
export function hookNextNodeServer(this: NextNodeServer) {
    setupWebSocketServer(this);
}
