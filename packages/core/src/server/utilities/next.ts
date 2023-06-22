import { Server } from 'node:http';
import NextNodeServer from 'next/dist/server/next-server';
import { isDynamicRoute } from 'next/dist/shared/lib/router/utils/is-dynamic';

/** A function that handles a WebSocket connection. */
export type SocketHandler = (
    /** The WebSocket client that connected. */
    client: import('ws').WebSocket,
    /** The HTTP request that initiated the WebSocket connection. */
    request: import('http').IncomingMessage,
    /** The WebSocket server. */
    server: import('ws').WebSocketServer
) => any;

/**
 * Get the http.Server instance from the NextNodeServer.
 * @param nextServer The NextNodeServer instance.
 * @returns The http.Server instance.
 */
// prettier-ignore
export function getHttpServer(nextServer: NextNodeServer) {
    if (!nextServer || !(nextServer instanceof NextNodeServer))
        throw new Error('Next WS is missing access to the NextNodeServer');

    // @ts-expect-error serverOptions is protected
    const httpServer = nextServer.serverOptions?.httpServer;
    if (!httpServer || !(httpServer instanceof Server))
        throw new Error('Next WS is missing access to the http.Server');

    return httpServer;
}

/**
 * Resolve a pathname to a page.
 * @param nextServer The NextNodeServer instance.
 * @param pathname The pathname to resolve.
 * @returns The resolved page, or null if the page could not be resolved.
 */
export async function resolvePathname(
    nextServer: NextNodeServer,
    pathname: string
) {
    if (pathname.startsWith('/_next')) return null;

    // @ts-expect-error hasPage is protected
    if (!isDynamicRoute(pathname) && (await nextServer.hasPage(pathname)))
        return pathname;

    // @ts-expect-error dynamicRoutes is protected
    for (const route of nextServer.dynamicRoutes ?? []) {
        const params = route.match(pathname) || undefined;
        if (params) return route.page;
    }

    return null;
}

/**
 * Get the page module for a page.
 * @param nextServer The NextNodeServer instance.
 * @param filename The filename of the page.
 * @returns The page module.
 */
export async function getPageModule(
    nextServer: NextNodeServer,
    filename: string
) {
    // @ts-expect-error HotReloader is private
    await nextServer.hotReloader!.ensurePage({
        page: filename,
        clientOnly: false,
    });

    // @ts-expect-error getPagePath is protected
    const builtPagePath = nextServer.getPagePath(filename);
    return require(builtPagePath);
}
