import * as Log from 'next/dist/build/output/log';
import NextNodeServer from 'next/dist/server/next-server';

/**
 * Resolve a pathname to a page, or null if the page could not be resolved.
 * @example resolvePathname(nextServer, '/about') // '/about/route'
 * @example resolvePathname(nextServer, '/user/1') // '/user/[id]/route'
 * @param nextServer The NextNodeServer instance.
 * @param pathname The pathname to resolve.
 * @returns The resolved page, or null if the page could not be resolved.
 */
export function resolvePathname(nextServer: NextNodeServer, pathname: string) {
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
  if (process.env['NODE_ENV'] !== 'production') {
    try {
      if ('hotReloader' in nextServer) {
        // @ts-expect-error - hotReloader only exists in Next.js 13
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await nextServer.hotReloader.ensurePage({
          page: filename,
          clientOnly: false,
        });
      } else if ('ensurePage' in nextServer) {
        // @ts-expect-error - ensurePage is protected
        await nextServer.ensurePage({ page: filename, clientOnly: false });
      } else {
        Log.warnOnce(
          '[next-ws] cannot find a way to ensure page, you may need to open routes in your browser first so Next.js compiles them'
        );
      }
    } catch (error) {
      Log.error(
        '[next-ws] was unable to ensure page, you may need to open the route in your browser first so Next.js compiles it'
      );
    }
  }

  // @ts-expect-error - getPagePath is protected
  const builtPagePath = nextServer.getPagePath(filename);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(builtPagePath) as PageModule;
}

export interface PageModule {
  routeModule?: {
    userland?: {
      SOCKET?: unknown;
    };
  };
}
