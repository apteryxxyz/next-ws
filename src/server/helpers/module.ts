import * as logger from 'next/dist/build/output/log.js';
import type NextNodeServer from 'next/dist/server/next-server.js';
import type { SocketHandler, UpgradeHandler } from './socket.js';

export async function importRouteModule(
  nextServer: NextNodeServer,
  filePath: string,
) {
  try {
    // CHANGE(next@14): hotReloader was removed and ensurePage was moved to NextNodeServer
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

  try {
    // @ts-expect-error - getPageModule is protected
    const buildPagePath = nextServer.getPagePath(filePath);
    return (await require(buildPagePath)).routeModule as RouteModule;
  } catch (cause) {
    console.error(cause);
    return undefined;
  }
}

export interface RouteModule {
  userland: {
    /** @deprecated Prefer UPGRADE and {@link UpgradeHandler} */
    SOCKET?: SocketHandler;
    UPGRADE?: UpgradeHandler;
  };
}

export type RouteParams<Path extends string> =
  Path extends `${infer Before}[[...${infer Param}]]${infer After}`
    ? RouteParams<Before> & { [K in Param]?: string[] } & RouteParams<After>
    : Path extends `${infer Before}[...${infer Param}]${infer After}`
      ? RouteParams<Before> & { [K in Param]: string[] } & RouteParams<After>
      : Path extends `${infer Before}[${infer Param}]${infer After}`
        ? RouteParams<Before> & { [K in Param]: string } & RouteParams<After>
        : // biome-ignore lint/complexity/noBannedTypes: do nothing
          {};

export type RouteContext<Path extends string> = {
  params: Record<string, string | string[] | undefined> &
    RouteParams<Path> &
    RouteParams<Path>;
};
