import * as logger from 'next/dist/build/output/log.js';
import type NextNodeServer from 'next/dist/server/next-server';
import AppRouteRouteModule, {
  type AppRouteRouteModuleOptions,
} from 'next/dist/server/route-modules/app-route/module';
import type { RouteModuleHandleContext } from 'next/dist/server/route-modules/route-module';
import type { NextSocketHandler, SocketHandler } from './socket';

type AppRouteSocketRouteModuleOptions = AppRouteRouteModuleOptions & {
  userland: AppRouteRouteModuleOptions['userland'] & {
    SOCKET?: SocketHandler | NextSocketHandler;
    experimental_socketAsyncContext?: boolean;
  };
};

class AppRouteSocketRouteModule extends AppRouteRouteModule {
  override userland: AppRouteSocketRouteModuleOptions['userland'];
  constructor(options: AppRouteSocketRouteModuleOptions) {
    super(options);
    this.userland = options.userland;
  }
}

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
  const moduleOptions = require(buildPagePath)
    .routeModule as AppRouteSocketRouteModuleOptions;
  return new AppRouteSocketRouteModule(moduleOptions);
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

export type RouteContext<Path extends string> = Omit<
  RouteModuleHandleContext,
  'params'
> & {
  params: RouteParams<Path> & RouteParams<Path>;
};
