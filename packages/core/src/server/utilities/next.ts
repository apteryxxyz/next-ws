import { Server } from 'node:http';
import NextNodeServer from 'next/dist/server/next-server';
import type { SocketHandler } from './ws';

/**
 * Get the http.Server instance from the NextNodeServer.
 * @param nextServer The NextNodeServer instance.
 * @returns The http.Server instance.
 */
export function getHttpServer(nextServer: NextNodeServer) {
  if (!nextServer || !(nextServer instanceof NextNodeServer))
    throw new Error('Next WS is missing access to the NextNodeServer');

  // @ts-expect-error - serverOptions is protected
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
export function resolvePathname(nextServer: NextNodeServer, pathname: string) {
  if (pathname.startsWith('/_next')) return null;

  const pathParts = pathname.split('/');
  const appRoutes = {
    // @ts-expect-error - appPathRoutes is protected
    ...nextServer.appPathRoutes,
    // @ts-expect-error - getAppPathRoutes is protected
    ...nextServer.getAppPathRoutes(),
  };

  for (const [key, [path]] of Object.entries(appRoutes)) {
    const hasDynamic = key.includes('[') && key.includes(']');

    if (hasDynamic) {
      const keyParts = key.split('/');
      if (keyParts.length !== pathParts.length) continue;

      for (let i = 0; i < keyParts.length; i++) {
        const keyPart = keyParts[i];
        const pathPart = pathParts[i];

        const isDynamic = keyPart.includes('[') && keyPart.includes(']');
        if (isDynamic) keyParts[i] = pathPart;
        if (keyParts[i] !== pathParts[i]) break;

        if (i === keyParts.length - 1) {
          if (!path?.endsWith('/route')) return null;
          return path;
        }
      }
    } else {
      if (key !== pathname) continue;
      if (!path?.endsWith('/route')) return null;
      return path;
    }
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
  // @ts-expect-error - hotReloader is private
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  await nextServer.hotReloader?.ensurePage({
    page: filename,
    clientOnly: false,
  });

  // @ts-expect-error - getPagePath is protected
  const builtPagePath = nextServer.getPagePath(filename);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(builtPagePath) as PageModule;
}

export interface PageModule {
  routeModule?: {
    userland?: {
      SOCKET?: SocketHandler;
    };
  };
}
