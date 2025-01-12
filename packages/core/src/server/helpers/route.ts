import * as logger from 'next/dist/build/output/log';
import type NextNodeServer from 'next/dist/server/next-server';
import type { SocketHandler } from './socket';

function createRouteRegex(routePattern: string) {
  const escapedPattern = routePattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const paramRegex = escapedPattern
    .replace(/\\\[([a-zA-Z0-9_]+)\\\]/g, '(?<$1>[^/]+)') // Match [param]
    .replace(/\\\[(?:\\\.){3}([a-zA-Z0-9_]+)\\\]/g, '(?<rest_$1>.+)'); // Match [...param]
  return new RegExp(`^${paramRegex}$`);
}

function getRouteParams(routePattern: string, routePath: string) {
  const routeRegex = createRouteRegex(routePattern);
  const match = routePath.match(routeRegex);
  if (!match) return null;
  if (!match.groups) return {};

  const params: Record<string, string | string[]> = {};
  for (let [k, v] of Object.entries(match.groups)) {
    if (k.startsWith('rest_')) (k = k.slice(5)), (v = v.split('/') as never);
    Reflect.set(params, k, v);
  }
  return params;
}

/**
 * Resolve a request path to a route file path and route parameters.
 * @param nextServer The NextNodeServer instance.
 * @param requestPath The request path to resolve for.
 * @returns The resolved file path and route parameters, or null if the route could not be resolved.
 */
export function resolvePathToRoute(
  nextServer: NextNodeServer,
  requestPath: string,
) {
  const routes = {
    // @ts-expect-error - appPathRoutes is protected
    ...nextServer.appPathRoutes,
    // @ts-expect-error - getAppPathRoutes is protected
    ...nextServer.getAppPathRoutes(),
  };

  for (const [routePath, [filePath]] of Object.entries(routes)) {
    const routeParams = getRouteParams(routePath, requestPath);
    if (routeParams) return { filePath: filePath!, routeParams };
  }

  return null;
}

/**
 * Import the route module for a route.
 * @param nextServer The NextNodeServer instance.
 * @param filePath The file path of the route.
 * @returns
 */
export async function importRouteModule(
  nextServer: NextNodeServer,
  filePath: string,
) {
  try {
    // In Next.js 14, hotReloader was removed and ensurePage was moved to NextNodeServer
    if ('hotReloader' in nextServer) {
      // @ts-expect-error - hotReloader only exists in Next.js 13
      await nextServer.hotReloader?.ensurePage({
        page: filePath,
        clientOnly: false,
      });
    } else if ('ensurePage' in nextServer) {
      // ensurePage throws an error in production, so we need to catch it
      // @ts-expect-error - ensurePage is protected
      await nextServer.ensurePage({ page: filePath, clientOnly: false });
    } else {
      // Future-proofing
      logger.warnOnce(
        '[next-ws] unable to ensure page, you may need to open the route in your browser first so Next.js compiles it',
      );
    }
  } catch {}

  // @ts-expect-error - getPageModule is protected
  const buildPagePath = nextServer.getPagePath(filePath);
  return require(buildPagePath) as RouteModule;
}

export interface RouteModule {
  routeModule?: {
    userland?: {
      SOCKET?: SocketHandler;
    };
  };
}