import { createRequestStoreForAPI } from 'next/dist/server/async-storage/request-store.js';
import { createWorkStore as createWorkStoreForAPI } from 'next/dist/server/async-storage/work-store.js';
import type NextNodeServer from 'next/dist/server/next-server';
import type { NextRequest } from 'next/server';

export function createWorkStore(nextServer: NextNodeServer, filePath: string) {
  return createWorkStoreForAPI({
    page: filePath,
    fallbackRouteParams: null,
    renderOpts: {
      // @ts-expect-error - renderOpts is protected
      ...nextServer.renderOpts,
      // @ts-expect-error - nextConfig is protected
      experimental: nextServer.nextConfig?.experimental,
      // @ts-expect-error - buildId is protected
      buildId: nextServer.buildId,
    },
    requestEndedState: undefined,
    isPrefetchRequest: false,
  });
}

export function createRequestStore(
  nextServer: NextNodeServer,
  request: NextRequest,
) {
  return createRequestStoreForAPI(
    request,
    request.nextUrl,
    { tags: [], expirationsByCacheKind: new Map() },
    // @ts-expect-error - renderOpts is protected
    nextServer.renderOpts.onUpdateCookies,
    // @ts-expect-error - renderOpts is protected
    nextServer.renderOpts.previewProps,
  );
}
