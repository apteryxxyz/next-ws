import type NextNodeServer from 'next/dist/server/next-server.js';

function compileRoutePattern(routePattern: string) {
  const escapedPattern = routePattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const paramRegex = escapedPattern
    .replace(/\\\[\\\[(?:\\\.){3}([a-z0-9_]+)\\\]\\\]/gi, '?(?<r_o_$1>.+)?') // [[...param]]
    .replace(/\\\[(?:\\\.){3}([a-z0-9_]+)\\\]/gi, '(?<r_$1>.+)') // [...param]
    .replace(/\\\[([a-z0-9_]+)\\\]/gi, '(?<$1>[^/]+)'); // [param]
  return new RegExp(`^${paramRegex}$`);
}

function getRouteParams(routePattern: string, requestPathname: string) {
  const routeRegex = compileRoutePattern(routePattern);
  const match = requestPathname.replace(/\/+$/, '').match(routeRegex);
  if (!match) return null;
  if (!match.groups) return {};

  const params: Record<string, string | string[]> = {};
  for (let [k, v] of Object.entries(match.groups)) {
    if (k.startsWith('r_')) {
      const optional = k.startsWith('r_o_');
      k = k.slice(optional ? 4 : 2);
      v = v?.split('/') as never;
    }
    if (v) Reflect.set(params, k, v);
  }
  return params;
}

export function findMatchingRoute(
  nextServer: NextNodeServer,
  requestPathname: string,
) {
  // @ts-expect-error - serverOptions is protected
  const basePath = nextServer.serverOptions?.conf.basePath || '';
  const appPathRoutes = {
    // @ts-expect-error - appPathRoutes is protected
    ...nextServer.appPathRoutes,
    // @ts-expect-error - getAppPathRoutes is protected
    ...nextServer.getAppPathRoutes(),
  };

  let matchedRoute = null;
  for (const [routePath, [filePath]] of Object.entries(appPathRoutes)) {
    const realPath = `${basePath}${routePath}`;
    const routeParams = getRouteParams(realPath, requestPathname);
    if (routeParams)
      matchedRoute = { filename: filePath!, params: routeParams };
  }
  return matchedRoute;
}
