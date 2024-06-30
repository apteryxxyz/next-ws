import * as logger from 'next/dist/build/output/log';
import type NextNodeServer from 'next/dist/server/next-server';
import type { SocketHandler } from './persistent';

/**
 * Get the environment metadata.
 * @returns The environment metadata.
 */
export function getEnvironmentMeta() {
  const isCustomServer = !process.title.startsWith('next-');
  const isMainProcess = process.env.NEXT_WS_MAIN_PROCESS === '1';
  const isDevelopment = process.env.NODE_ENV === 'development';
  return { isCustomServer, isMainProcess, isDevelopment };
}

/**
 * Resolve a filename to a page.
 * @param nextServer The NextNodeServer instance.
 * @param pathname The pathname to resolve.
 * @returns The resolved page filename, or null if the page could not be resolved.
 */
export function resolveFilename(nextServer: NextNodeServer, pathname: string) {
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
        const keyPart = keyParts[i]!;
        const pathPart = pathParts[i]!;

        const isDynamic = keyPart.includes('[') && keyPart.includes(']');
        if (isDynamic) keyParts[i] = pathPart;
        if (keyParts[i] !== pathParts[i]) break;

        if (i === keyParts.length - 1)
          if (!path?.endsWith('/route')) return path;
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
  filename: string,
) {
  try {
    // In Next.js 14, hotReloader was removed and ensurePage was moved to NextNodeServer
    if ('hotReloader' in nextServer) {
      // @ts-expect-error - hotReloader only exists in Next.js 13
      await nextServer.hotReloader?.ensurePage({
        page: filename,
        clientOnly: false,
      });
    } else if ('ensurePage' in nextServer) {
      // ensurePage throws an error in production, so we need to catch it
      // @ts-expect-error - ensurePage is protected
      await nextServer.ensurePage({ page: filename, clientOnly: false });
    } else {
      // Future-proofing
      logger.warnOnce(
        '[next-ws] unable to ensure page, you may need to open the route in your browser first so Next.js compiles it',
      );
    }
  } catch {}

  // @ts-expect-error - getPageModule is protected
  const buildPagePath = nextServer.getPagePath(filename);
  return require(buildPagePath) as PageModule;
}

export interface PageModule {
  routeModule?: {
    userland?: {
      SOCKET?: SocketHandler;
    };
  };
}
