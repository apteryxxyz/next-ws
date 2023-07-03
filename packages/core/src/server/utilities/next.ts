import { Server } from 'node:http';
import NextNodeServer from 'next/dist/server/next-server';

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

    const appRoutes = {
        // @ts-expect-error appPathRoutes is protected
        ...nextServer.appPathRoutes,
        // @ts-expect-error getAppPathRoutes is protected
        ...nextServer.getAppPathRoutes(),
    };

    // TODO: 'appRoutes[pathname]' is an array of routes,  need to investigate in which case that array has more than one item
    if (pathname in appRoutes) {
        const route = appRoutes[pathname][0];
        if (!route?.endsWith('/route')) return null;
        return route;
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
    await nextServer.hotReloader?.ensurePage({
        page: filename,
        clientOnly: false,
    });

    // @ts-expect-error getPagePath is protected
    const builtPagePath = nextServer.getPagePath(filename);
    return require(builtPagePath);
}
