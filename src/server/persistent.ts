import * as logger from 'next/dist/build/output/log.js';

function getEnvironmentMeta() {
  const isCustomServer = !process.title.startsWith('next-');
  const isMainProcess = process.env.NEXT_WS_MAIN_PROCESS === '1';
  const isDevelopment = process.env.NODE_ENV === 'development';
  return { isCustomServer, isMainProcess, isDevelopment };
}

function mainProcessOnly(callerName: string) {
  if (process.env.NEXT_WS_SKIP_ENVIRONMENT_CHECK === '1') return;

  const meta = getEnvironmentMeta();
  if (!meta.isCustomServer && !meta.isMainProcess) {
    throw new Error(
      `[next-ws] Attempt to call '${callerName}' outside the main process.
You may be attempting to interact with the WebSocket server outside of a UPGRADE handler. This will fail in production, as Next.js employs a worker process for routing, which do not have access to the WebSocket server on the main process.
You can resolve this by using a custom server.`,
    );
  } else if (!meta.isCustomServer) {
    logger.warnOnce(
      `[next-ws] The function '${callerName}' was called without a custom server.
This could lead to unintended behaviour, especially if you're attempting to interact with the WebSocket server outside of a UPGRADE handler.
Please note, while such configurations might function during development, they will fail in production. This is because Next.js employs a worker process for routing in production, which do not have access to the WebSocket server on the main process.
You can resolve this by using a custom server.`,
    );
  }
}

//

import type { Server as HttpServer } from 'node:http';
export const kHttpServer = Symbol.for('kHttpServer');

export function getHttpServer() {
  mainProcessOnly('getHttpServer');
  return Reflect.get(globalThis, kHttpServer) as HttpServer | undefined;
}

export function setHttpServer<T extends HttpServer | undefined>(server: T) {
  mainProcessOnly('setHttpServer');
  Reflect.set(globalThis, kHttpServer, server);
  return getHttpServer() as T;
}

export function useHttpServer<T extends HttpServer | undefined>(
  server: () => T,
): T {
  mainProcessOnly('useHttpServer');
  const existing = getHttpServer();
  if (existing) return existing as T;
  return setHttpServer(server());
}

//

import type { WebSocketServer } from 'ws';
export const kWebSocketServer = Symbol.for('kWebSocketServer');

export function getWebSocketServer() {
  mainProcessOnly('getWebSocketServer');
  return Reflect.get(globalThis, kWebSocketServer) as
    | WebSocketServer
    | undefined;
}

export function setWebSocketServer<T extends WebSocketServer | undefined>(
  server: T,
) {
  mainProcessOnly('setWebSocketServer');
  Reflect.set(globalThis, kWebSocketServer, server);
  return getWebSocketServer() as T;
}

export function useWebSocketServer<T extends WebSocketServer | undefined>(
  server: () => T,
): T {
  mainProcessOnly('useWebSocketServer');
  const existing = getWebSocketServer();
  if (existing) return existing as T;
  return setWebSocketServer(server()) as T;
}
