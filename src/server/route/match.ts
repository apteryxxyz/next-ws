import type NextNodeServer from 'next/dist/server/next-server';

function compileRoutePattern(routePattern: string) {
  const escapedPattern = routePattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const paramRegex = escapedPattern
    .replace(/\\\[([a-zA-Z0-9_]+)\\\]/g, '(?<$1>[^/]+)') // Match [param]
    .replace(/\\\[(?:\\\.){3}([a-zA-Z0-9_]+)\\\]/g, '(?<rest_$1>.+)'); // Match [...param]
  return new RegExp(`^${paramRegex}$`);
}

function getRouteParams(routePattern: string, routePath: string) {
  const routeRegex = compileRoutePattern(routePattern);
  const match = routePath.replace(/\/+$/, '').match(routeRegex);
  if (!match) return null;
  if (!match.groups) return {};

  const params: Record<string, string | string[]> = {};
  for (let [k, v] of Object.entries(match.groups)) {
    if (k.startsWith('rest_')) {
      k = k.slice(5);
      v = v.split('/') as never;
    }
    Reflect.set(params, k, v);
  }
  return params;
}

export function findMatchingRoute(
  nextServer: NextNodeServer,
  requestPath: string,
) {
  // @ts-expect-error - serverOptions is protected
  const basePath = nextServer.serverOptions?.conf.basePath;
  const appPathRoutes = {
    // @ts-expect-error - appPathRoutes is protected
    ...nextServer.appPathRoutes,
    // @ts-expect-error - getAppPathRoutes is protected
    ...nextServer.getAppPathRoutes(),
  };

  let matchedRoute = null;
  for (const [routePath, [filePath]] of Object.entries(appPathRoutes)) {
    const realPath = `${basePath}${routePath}`;
    const routeParams = getRouteParams(realPath, requestPath);
    if (routeParams)
      matchedRoute = { filename: filePath!, params: routeParams };
  }
  return matchedRoute;
}
