import * as logger from 'next/dist/build/output/log';
import { getEnvironmentMeta } from './next';

function mainProcessOnly(fnName: string) {
  if (process.env.NEXT_WS_SKIP_ENVIRONMENT_CHECK === '1') return;

  const meta = getEnvironmentMeta();
  if (!meta.isMainProcess) {
    throw new Error(
      `[next-ws] Attempt to invoke '${fnName}' outside the main process.
You may be attempting to interact with the WebSocket server outside of a SOCKET handler. This is likely to fail in production environments, as Next.js employs a worker process for routing in production, which do not have access to the WebSocket server on the main process.`,
    );
  } else if (!meta.isCustomServer) {
    logger.warnOnce(
      `[next-ws] Caution: The function '${fnName}' was invoked without a custom server.
This could lead to unintended behaviour, especially if you're attempting to interact with the WebSocket server outside of a SOCKET handler. Please note, while such configurations might function during development, they are likely to fail in production environments. This is because Next.js employs a worker process for routing in production, which do not have access to the WebSocket server on the main process.`,
    );
  }
}

// ========== HTTP Server ==========

import type { Server as HttpServer } from 'node:http';
export const NextWsHttpServer = Symbol.for('NextWs_HttpServer');

/**
 * Set the HTTP server that the WebSocket server should listen on, must be called before the WebSocket server is created.
 * @param server The HTTP server.
 */
export function setHttpServer(server: HttpServer) {
  Reflect.set(globalThis, NextWsHttpServer, server);
}

/**
 * Get the HTTP server that the WebSocket server is listening on.
 * @remark If you want to access the HTTP server outside of a SOCKET handler, you must be using a custom server.
 * @returns The HTTP server.
 * @throws If attempting to access the HTTP server outside of the main process.
 */
export function getHttpServer() {
  mainProcessOnly('getHttpServer');
  return Reflect.get(globalThis, NextWsHttpServer) as HttpServer;
}

export function useHttpServer(server?: HttpServer) {
  const existing = getHttpServer();
  if (existing) return existing;
  if (server) setHttpServer(server);
  return server;
}

// ========== WebSocket Server ==========

import type { WebSocketServer } from 'ws';
export const NextWsWebSocketServer = Symbol.for('NextWs_WebSocketServer');

/**
 * Set the WebSocket server that the WebSocket server should listen on, must be called before the WebSocket server is created.
 * @param wsServer The WebSocket server.
 */
export function setWebSocketServer(wsServer: WebSocketServer) {
  Reflect.set(globalThis, NextWsWebSocketServer, wsServer);
}

/**
 * Get the WebSocket server that the WebSocket server is listening on.
 * @remark If you want to access the WebSocket server outside of a SOCKET handler, you must be using a custom server.
 * @returns The WebSocket server.
 * @throws If attempting to access the WebSocket server outside of the main process.
 */
export function getWebSocketServer() {
  mainProcessOnly('getWebSocketServer');
  return Reflect.get(globalThis, NextWsWebSocketServer) as WebSocketServer;
}

export function useWebSocketServer(wsServer?: WebSocketServer) {
  const existing = getWebSocketServer();
  if (existing) return existing;
  if (wsServer) setWebSocketServer(wsServer);
  return wsServer;
}

/** A function that handles a WebSocket connection. */
export type SocketHandler = (
  /** The WebSocket client that connected. */
  client: import('ws').WebSocket,
  /** The HTTP request that initiated the WebSocket connection. */
  request: import('http').IncomingMessage,
  /** The WebSocket server. */
  server: import('ws').WebSocketServer,
) => unknown | (() => void);
