import { Server } from 'node:http';
import path from 'node:path';
import type internal from 'node:stream';
import * as Log from 'next/dist/build/output/log';
import NextNodeServer from 'next/dist/server/next-server';
import { isDynamicRoute } from 'next/dist/shared/lib/router/utils/is-dynamic';
import { WebSocketServer } from 'ws';

const openSockets = new Set<internal.Duplex>();
let existingWebSocketServer: WebSocketServer | undefined;

function hookNextNodeServer(this: NextNodeServer) {
    if (!this || !(this instanceof NextNodeServer))
        throw new Error(
            "[next-ws] 'this' of hookNextNodeServer is not a NextNodeServer"
        );

    const server = this.serverOptions?.httpServer;
    if (!server || !(server instanceof Server))
        throw new Error(
            "[next-ws] Failed to find NextNodeServer's HTTP server"
        );

    if (existingWebSocketServer) return;
    const wss = new WebSocketServer({ noServer: true });
    Log.ready('[next-ws] loaded successfully');
    existingWebSocketServer = wss;

    server.on('upgrade', async (request, socket, head) => {
        const url = new URL(request.url ?? '', 'http://next-ws');

        // Ignore requests to Next.js' own internal files
        if (url.pathname.startsWith('/_next')) return;

        // Attempt to find a matching page
        const pathname = await isPageFound.call(this, url.pathname);
        if (!pathname) return;
        const internalPathname = path
            .join(pathname, 'route')
            .replaceAll(path.sep, '/');

        // Ensure the page is built
        // @ts-expect-error HotReloader is private
        await this.hotReloader!.ensurePage({
            page: internalPathname,
            clientOnly: false,
        });

        let builtPagePath;
        try {
            builtPagePath = this.getPagePath(internalPathname);
        } catch {
            return Log.error(`[next-ws] failed to get page ${pathname}`);
        }

        const pageModule = await require(builtPagePath);
        // Equates to the exported "SOCKET" function in the route file
        const socketHandler = pageModule.routeModule.userland.SOCKET;
        if (!socketHandler || typeof socketHandler !== 'function')
            return Log.error(
                `[next-ws] failed to find SOCKET handler for page ${pathname}`
            );

        wss.handleUpgrade(request, socket, head, socketHandler);

        if (this.serverOptions.dev) {
            openSockets.add(socket);
            socket.on('close', () => openSockets.delete(socket));
        }
    });
}

async function isPageFound(this: NextNodeServer, pathname: string) {
    if (!isDynamicRoute(pathname) && (await this.hasPage(pathname)))
        return pathname;

    for (const route of this.dynamicRoutes ?? []) {
        const params = route.match(pathname) || undefined;
        if (params) return route.page;
    }

    return false;
}

export { hookNextNodeServer };
